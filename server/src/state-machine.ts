import { GameState, PlayerAction, GameStatus, RoundState, HandState, PlayerState, Card, PlayedCard, HandResult, RoundResult } from './game-types';
import { createDeck, shuffleDeck, getRankValue } from './deck';

export class GameStateMachine {

  // Initialize game from waiting room
  static startGame(state: GameState, action: PlayerAction): GameState {
    if (action.type !== 'START_GAME') throw new Error('Invalid action');
    if (action.playerId !== state.adminId) throw new Error('Only admin can start game');
    if (state.status !== 'waiting') throw new Error('Game already started');
    if (state.players.length < 2) throw new Error('Need at least 2 players');

    // Generate round sequence [1,2,3...N...3,2,1]
    const roundSequence: number[] = [];
    for (let i = 1; i <= state.numberOfRounds; i++) roundSequence.push(i);
    for (let i = state.numberOfRounds - 1; i >= 1; i--) roundSequence.push(i);

    // Randomly select starting player (PG1)
    const startingPlayerIndex = Math.floor(Math.random() * state.players.length);

    const updatedState = {
      ...state,
      status: 'dealing' as GameStatus,
      roundSequence,
      startedAt: Date.now(),
      playerOrder: state.players.map(p => p.id),
      players: state.players.map((p, idx) => ({
        ...p,
        naturalOrder: idx + 1,
        hand: [],
        bet: null,
        handsWon: 0,
        totalScore: 0
      }))
    };

    const { round, players } = this.initializeRound(updatedState, 0, state.players[startingPlayerIndex].id);

    return {
      ...updatedState,
      players,
      currentRound: round
    };
  }

  // Initialize a new round
  private static initializeRound(state: GameState, roundIndex: number, startingPlayerId: string): { round: RoundState; players: PlayerState[] } {
    const roundNumber = state.roundSequence[roundIndex];
    const cardsPerPlayer = roundNumber;

    // Deal cards
    const deck = shuffleDeck(createDeck());
    const mesa = deck.pop()!;

    // Deal to players
    const updatedPlayers = state.players.map(p => ({
      ...p,
      hand: deck.splice(0, cardsPerPlayer),
      bet: null,
      handsWon: 0
    }));

    // Determine betting order starting from PS1
    const startIdx = state.playerOrder.indexOf(startingPlayerId);
    const bettingOrder = [
      ...state.playerOrder.slice(startIdx),
      ...state.playerOrder.slice(0, startIdx)
    ];

    return {
      players: updatedPlayers,
      round: {
        roundNumber,
        roundIndex,
        cardsPerPlayer,
        mesa,
        startingPlayerId,
        bettingOrder,
        currentBettingIndex: 0,
        handsPlayed: 0,
        currentHand: null,
        completedHands: []
      }
    };
  }

  // Transition from dealing to betting
  static startBetting(state: GameState): GameState {
    if (state.status !== 'dealing') throw new Error('Not in dealing phase');
    return { ...state, status: 'betting' };
  }

  // Handle bet placement
  static placeBet(state: GameState, action: PlayerAction): GameState {
    if (action.type !== 'PLACE_BET') throw new Error('Invalid action');
    if (state.status !== 'betting') throw new Error('Not in betting phase');
    if (!state.currentRound) throw new Error('No active round');

    const { currentRound } = state;
    const expectedPlayerId = currentRound.bettingOrder[currentRound.currentBettingIndex];

    if (action.playerId !== expectedPlayerId) throw new Error('Not your turn to bet');
    if (action.bet < 0 || action.bet > currentRound.cardsPerPlayer) throw new Error('Invalid bet');

    // Check last player constraint
    const isLastPlayer = currentRound.currentBettingIndex === currentRound.bettingOrder.length - 1;
    if (isLastPlayer) {
      const sumOfBets = state.players
        .filter(p => p.bet !== null)
        .reduce((sum, p) => sum + p.bet!, 0);
      if (sumOfBets + action.bet === currentRound.cardsPerPlayer) {
        throw new Error('Last player cannot make sum equal to round size');
      }
    }

    // Update player bet
    const updatedPlayers = state.players.map(p =>
      p.id === action.playerId ? { ...p, bet: action.bet } : p
    );

    const nextBettingIndex = currentRound.currentBettingIndex + 1;
    const bettingComplete = nextBettingIndex >= currentRound.bettingOrder.length;

    return {
      ...state,
      players: updatedPlayers,
      currentRound: {
        ...currentRound,
        currentBettingIndex: nextBettingIndex
      },
      status: bettingComplete ? 'playing_hand' : 'betting'
    };
  }

  // Start a new hand
  static startHand(state: GameState): GameState {
    if (state.status !== 'playing_hand') throw new Error('Not ready to play hand');
    if (!state.currentRound) throw new Error('No active round');
    if (state.currentRound.currentHand) throw new Error('Hand already in progress');

    const currentRound = state.currentRound;
    const handNumber = currentRound.handsPlayed + 1;

    // Determine hand order (PH1 is winner of previous hand, or PS2 for first hand)
    let handOrder: string[];
    if (handNumber === 1) {
      // First hand: PS2 starts
      handOrder = [
        ...currentRound.bettingOrder.slice(1),
        currentRound.bettingOrder[0]
      ];
    } else {
      // Subsequent hands: previous winner starts
      const lastHand = currentRound.completedHands[currentRound.completedHands.length - 1];
      const winnerIdx = state.playerOrder.indexOf(lastHand.winnerId);
      handOrder = [
        ...state.playerOrder.slice(winnerIdx),
        ...state.playerOrder.slice(0, winnerIdx)
      ];
    }

    return {
      ...state,
      currentRound: {
        ...currentRound,
        currentHand: {
          handNumber,
          cardsPlayed: [],
          pinta: null,
          currentPlayerIndex: 0,
          handOrder
        }
      }
    };
  }

  // Handle card play
  static playCard(state: GameState, action: PlayerAction): GameState {
    if (action.type !== 'PLAY_CARD') throw new Error('Invalid action');
    if (state.status !== 'playing_hand') throw new Error('Not in playing phase');
    if (!state.currentRound?.currentHand) throw new Error('No active hand');

    const currentRound = state.currentRound;
    const currentHand = currentRound.currentHand!; // Non-null assertion after check
    const expectedPlayerId = currentHand.handOrder[currentHand.currentPlayerIndex];

    if (action.playerId !== expectedPlayerId) throw new Error('Not your turn');

    const player = state.players.find(p => p.id === action.playerId)!;
    const cardIndex = player.hand.findIndex(c =>
      c.suit === action.card.suit && c.rank === action.card.rank
    );

    if (cardIndex === -1) throw new Error('Card not in hand');

    // Validate suit following rules
    if (currentHand.pinta && currentHand.cardsPlayed.length > 0) {
      const hasPinta = player.hand.some(c => c.suit === currentHand.pinta);
      if (hasPinta && action.card.suit !== currentHand.pinta) {
        throw new Error('Must follow pinta suit');
      }
    }

    // Remove card from hand
    const updatedPlayers = state.players.map(p =>
      p.id === action.playerId
        ? { ...p, hand: p.hand.filter((_, idx) => idx !== cardIndex) }
        : p
    );

    const playedCard: PlayedCard = {
      playerId: action.playerId,
      card: action.card,
      playOrder: currentHand.cardsPlayed.length + 1,
      timestamp: Date.now()
    };

    const pinta = currentHand.pinta || action.card.suit;
    const nextPlayerIndex = currentHand.currentPlayerIndex + 1;
    const handComplete = nextPlayerIndex >= currentHand.handOrder.length;

    const updatedState = {
      ...state,
      players: updatedPlayers,
      currentRound: {
        ...currentRound,
        currentHand: {
          handNumber: currentHand.handNumber,
          handOrder: currentHand.handOrder,
          cardsPlayed: [...currentHand.cardsPlayed, playedCard],
          pinta,
          currentPlayerIndex: nextPlayerIndex
        }
      },
      status: handComplete ? 'hand_complete' : 'playing_hand' as GameStatus
    };

    // If hand is complete, process the winner
    if (handComplete) {
      return this.completeHand(updatedState);
    }

    return updatedState;
  }

  // Determine hand winner
  static completeHand(state: GameState): GameState {
    if (state.status !== 'hand_complete') throw new Error('Hand not complete');
    if (!state.currentRound?.currentHand) throw new Error('No active hand');

    const currentRound = state.currentRound;
    const currentHand = currentRound.currentHand!; // Non-null assertion after check
    const mesaSuit = currentRound.mesa.suit;
    const pinta = currentHand.pinta!;

    // Determine winner
    let winningCard = currentHand.cardsPlayed[0];
    let winnerId = winningCard.playerId;

    for (const played of currentHand.cardsPlayed.slice(1)) {
      if (this.compareCards(played.card, winningCard.card, mesaSuit, pinta) > 0) {
        winningCard = played;
        winnerId = played.playerId;
      }
    }

    // Update winner's handsWon
    const updatedPlayers = state.players.map(p =>
      p.id === winnerId ? { ...p, handsWon: p.handsWon + 1 } : p
    );

    const handResult: HandResult = {
      handNumber: currentHand.handNumber,
      cardsPlayed: currentHand.cardsPlayed,
      pinta: pinta,
      winnerId,
      winningCard: winningCard.card,
      timestamp: Date.now()
    };

    // Always go to hand_complete first, regardless of whether round is done
    return {
      ...state,
      players: updatedPlayers,
      currentRound: {
        ...currentRound,
        handsPlayed: currentRound.handsPlayed + 1,
        currentHand: {
          ...currentHand,
          playersReady: []  // Initialize ready check for hand
        },
        completedHands: [...currentRound.completedHands, handResult]
      },
      status: 'hand_complete'
    };
  }

  // Handle continue action (ready check)
  static handleContinue(state: GameState, action: PlayerAction): GameState {
    if (action.type !== 'CONTINUE') throw new Error('Invalid action');

    if (state.status === 'hand_complete') {
      return this.handleHandContinue(state, action);
    } else if (state.status === 'round_complete') {
      return this.handleRoundContinue(state, action);
    }

    throw new Error('Continue action only valid in hand_complete or round_complete');
  }

  private static handleHandContinue(state: GameState, action: PlayerAction): GameState {
    if (!state.currentRound?.currentHand) throw new Error('No active hand');

    const currentHand = state.currentRound.currentHand;
    const playersReady = currentHand.playersReady || [];

    // Check if player already ready
    if (playersReady.includes(action.playerId)) {
      return state; // Already ready, no change
    }

    const updatedReady = [...playersReady, action.playerId];
    const allReady = updatedReady.length >= state.players.length;

    if (allReady) {
      // All players ready, check if round is complete
      const roundComplete = state.currentRound.handsPlayed >= state.currentRound.cardsPerPlayer;
      
      if (roundComplete) {
        // Calculate and update scores before showing round_complete
        const updatedPlayers = state.players.map(p => {
          const points = p.bet === p.handsWon ? 10 + 2 * p.handsWon : 0;
          return { ...p, totalScore: p.totalScore + points };
        });
        
        // Transition to round_complete with updated scores
        return {
          ...state,
          players: updatedPlayers,
          currentRound: {
            ...state.currentRound,
            currentHand: null,
            playersReady: []  // Initialize ready check for round
          },
          status: 'round_complete'
        };
      }
      
      // More hands to play, transition to next hand
      return {
        ...state,
        currentRound: {
          ...state.currentRound,
          currentHand: null
        },
        status: 'playing_hand'
      };
    }

    // Update ready list
    return {
      ...state,
      currentRound: {
        ...state.currentRound,
        currentHand: {
          ...currentHand,
          playersReady: updatedReady
        }
      }
    };
  }

  private static handleRoundContinue(state: GameState, action: PlayerAction): GameState {
    if (!state.currentRound) throw new Error('No active round');

    const playersReady = state.currentRound.playersReady || [];

    // Check if player already ready
    if (playersReady.includes(action.playerId)) {
      return state; // Already ready, no change
    }

    const updatedReady = [...playersReady, action.playerId];
    const allReady = updatedReady.length >= state.players.length;

    if (allReady) {
      // All players ready, complete the round
      return this.completeRound(state);
    }

    // Update ready list
    return {
      ...state,
      currentRound: {
        ...state.currentRound,
        playersReady: updatedReady
      }
    };
  }

  // Compare two cards (returns positive if card1 wins)
  private static compareCards(card1: Card, card2: Card, mesa: string, pinta: string): number {
    const getSuitPriority = (suit: string) => {
      if (suit === mesa) return 3;
      if (suit === pinta) return 2;
      return 1;
    };

    const priority1 = getSuitPriority(card1.suit);
    const priority2 = getSuitPriority(card2.suit);

    if (priority1 !== priority2) return priority1 - priority2;
    return getRankValue(card1.rank) - getRankValue(card2.rank);
  }

  // Complete round and move to next round or end game
  static completeRound(state: GameState): GameState {
    if (state.status !== 'round_complete') throw new Error('Round not complete');
    if (!state.currentRound) throw new Error('No active round');

    const { currentRound } = state;

    // Scores already calculated when transitioning to round_complete
    const scores = state.players.map(p => {
      const points = p.bet === p.handsWon ? 10 + 2 * p.handsWon : 0;
      return {
        playerId: p.id,
        handsWon: p.handsWon,
        points
      };
    });

    const roundResult: RoundResult = {
      roundNumber: currentRound.roundNumber,
      roundIndex: currentRound.roundIndex,
      cardsPerPlayer: currentRound.cardsPerPlayer,
      mesa: currentRound.mesa,
      startingPlayerId: currentRound.startingPlayerId,
      bets: state.players.map(p => ({ playerId: p.id, bet: p.bet! })),
      hands: currentRound.completedHands,
      scores,
      timestamp: Date.now()
    };

    const nextRoundIndex = currentRound.roundIndex + 1;
    const gameComplete = nextRoundIndex >= state.roundSequence.length;

    if (gameComplete) {
      return {
        ...state,
        status: 'game_complete',
        completedAt: Date.now(),
        completedRounds: [...state.completedRounds, roundResult],
        currentRound: null
      };
    }

    // Determine next starting player (PG(roundIndex+1))
    const nextStartingPlayerIndex = nextRoundIndex % state.playerOrder.length;
    const nextStartingPlayerId = state.playerOrder[nextStartingPlayerIndex];

    const { round: nextRound, players: playersWithCards } = this.initializeRound(
      state,
      nextRoundIndex,
      nextStartingPlayerId
    );

    return {
      ...state,
      players: playersWithCards,
      status: 'dealing',
      completedRounds: [...state.completedRounds, roundResult],
      currentRound: nextRound
    };
  }

  // Main action dispatcher
  static processAction(state: GameState, action: PlayerAction): GameState {
    switch (action.type) {
      case 'START_GAME':
        return this.startGame(state, action);
      case 'PLACE_BET':
        return this.placeBet(state, action);
      case 'PLAY_CARD':
        return this.playCard(state, action);
      case 'CONTINUE':
        return this.handleContinue(state, action);
      default:
        throw new Error('Unknown action type');
    }
  }

  // Auto-transition states that don't require player input
  static autoTransition(state: GameState): GameState {
    switch (state.status) {
      case 'dealing':
        return this.startBetting(state);
      case 'playing_hand':
        if (!state.currentRound?.currentHand) {
          return this.startHand(state);
        }
        return state;
      default:
        return state;
    }
  }
}
