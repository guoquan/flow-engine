import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { SpyInstance } from 'vitest';
import { BehaviorController } from '../src/core/BehaviorController';
import { AvatarBehaviorStates } from '../src/types';

describe('BehaviorController', () => {
  let brain: BehaviorController;
  let performanceNowSpy: SpyInstance;

  beforeEach(() => {
    brain = new BehaviorController();
    performanceNowSpy = vi.spyOn(performance, 'now');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize in IDLE state', () => {
    expect(brain.getState()).toBe(AvatarBehaviorStates.IDLE);
  });

  it('should transition to new states correctly', () => {
    const spy = vi.fn();
    brain.onStateChange = spy;

    brain.setIntent({ state: AvatarBehaviorStates.THINKING });
    
    expect(brain.getState()).toBe(AvatarBehaviorStates.THINKING);
    expect(spy).toHaveBeenCalledWith(AvatarBehaviorStates.THINKING, expect.any(Object));
  });

  it('should ignore duplicate state transitions', () => {
    brain.setIntent({ state: AvatarBehaviorStates.THINKING });
    const spy = vi.fn();
    brain.onStateChange = spy;

    // Setting same state again
    brain.setIntent({ state: AvatarBehaviorStates.THINKING });
    
    expect(spy).not.toHaveBeenCalled();
  });

  it('should allow duplicate EMOTIONAL state transitions and update metadata', () => {
    brain.setIntent({ state: AvatarBehaviorStates.EMOTIONAL, emotion: 'happy' });
    const spy = vi.fn();
    brain.onStateChange = spy;

    // Setting same emotional state again but with different mood
    brain.setIntent({ state: AvatarBehaviorStates.EMOTIONAL, emotion: 'sad' });
    
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith(AvatarBehaviorStates.EMOTIONAL, expect.objectContaining({ emotion: 'sad' }));
  });

  it('should revert to IDLE after timeout', () => {
    let currentTime = 1000;
    performanceNowSpy.mockImplementation(() => currentTime);

    brain.setIntent({ state: AvatarBehaviorStates.TALKING, duration: 2000 });
    expect(brain.getState()).toBe(AvatarBehaviorStates.TALKING);

    // Simulate time passing
    currentTime += 2500;
    brain.update(currentTime);

    expect(brain.getState()).toBe(AvatarBehaviorStates.IDLE);
  });

  it('should handle duration: 0 as an immediate timeout', () => {
    let currentTime = 1000;
    performanceNowSpy.mockImplementation(() => currentTime);

    brain.setIntent({ state: AvatarBehaviorStates.THINKING, duration: 0 });
    expect(brain.getState()).toBe(AvatarBehaviorStates.THINKING);

    // Next update should trigger timeout
    brain.update(currentTime);
    expect(brain.getState()).toBe(AvatarBehaviorStates.IDLE);
  });

  it('should not re-trigger timeout if already in IDLE', () => {
    let currentTime = 1000;
    performanceNowSpy.mockImplementation(() => currentTime);
    const consoleSpy = vi.spyOn(console, 'log');

    // Force a state that will timeout
    brain.setIntent({ state: AvatarBehaviorStates.THINKING, duration: 1000 });
    
    currentTime += 2000;
    brain.update(currentTime); // First timeout
    expect(brain.getState()).toBe(AvatarBehaviorStates.IDLE);
    
    const countAfterFirstTimeout = consoleSpy.mock.calls.length;
    
    // Call update again - should NOT log another timeout message
    brain.update(currentTime + 100);
    expect(consoleSpy.mock.calls.length).toBe(countAfterFirstTimeout);
  });

  it('should handle complex timeout sequences correctly', () => {
    let currentTime = 1000;
    performanceNowSpy.mockImplementation(() => currentTime);

    // 1. First state with timeout
    brain.setIntent({ state: AvatarBehaviorStates.THINKING, duration: 1000 });
    
    currentTime += 1500;
    brain.update(currentTime); // Auto-revert to IDLE
    expect(brain.getState()).toBe(AvatarBehaviorStates.IDLE);

    // 2. Transition immediately after timeout
    brain.setIntent({ state: AvatarBehaviorStates.TALKING, duration: 5000 });
    expect(brain.getState()).toBe(AvatarBehaviorStates.TALKING);

    // 3. Move time forward but NOT enough to timeout
    currentTime += 2000;
    brain.update(currentTime);
    expect(brain.getState()).toBe(AvatarBehaviorStates.TALKING);

    // 4. Manually override before timeout
    brain.setIntent({ state: AvatarBehaviorStates.LISTENING });
    expect(brain.getState()).toBe(AvatarBehaviorStates.LISTENING);
    
    // Check that previous timeout is cleared
    currentTime += 10000;
    brain.update(currentTime);
    expect(brain.getState()).toBe(AvatarBehaviorStates.LISTENING); // Should stay LISTENING (null timeout)
  });

  it('should prevent re-entrant calls to setIntent and recover from errors', () => {
    const consoleSpy = vi.spyOn(console, 'log');
    
    brain.onStateChange = () => {
      // Synchronously call setIntent during a transition
      // This should be ignored due to the lock
      brain.setIntent({ state: AvatarBehaviorStates.THINKING });
      throw new Error('Callback Failure');
    };

    // This should trigger transition -> callback -> nested setIntent (blocked) -> throw -> finally unlock
    expect(() => {
      brain.setIntent({ state: AvatarBehaviorStates.TALKING });
    }).toThrow('Callback Failure');
    
    // Verify final state is TALKING (nested THINKING was ignored)
    expect(brain.getState()).toBe(AvatarBehaviorStates.TALKING);
    
    // Verify nested call didn't log its transition
    const transitionLogs = consoleSpy.mock.calls.filter(args => args[0].includes('Transition'));
    expect(transitionLogs.length).toBe(1);
    expect(transitionLogs[0][0]).toContain('IDLE -> TALKING');

    // Verify recovery: subsequent calls work after error
    brain.onStateChange = undefined;
    brain.setIntent({ state: AvatarBehaviorStates.IDLE });
    expect(brain.getState()).toBe(AvatarBehaviorStates.IDLE);
  });
});