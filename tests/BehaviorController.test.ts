import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BehaviorController } from '../src/core/BehaviorController';
import { AvatarBehaviorState } from '../src/types';

describe('BehaviorController', () => {
  let brain: BehaviorController;

  beforeEach(() => {
    brain = new BehaviorController();
  });

  it('should initialize in IDLE state', () => {
    expect(brain.getState()).toBe(AvatarBehaviorState.IDLE);
  });

  it('should transition to new states correctly', () => {
    const spy = vi.fn();
    brain.onStateChange = spy;

    brain.setIntent({ state: AvatarBehaviorState.THINKING });
    
    expect(brain.getState()).toBe(AvatarBehaviorState.THINKING);
    expect(spy).toHaveBeenCalledWith(AvatarBehaviorState.THINKING, expect.any(Object));
  });

  it('should ignore duplicate state transitions', () => {
    brain.setIntent({ state: AvatarBehaviorState.THINKING });
    const spy = vi.fn();
    brain.onStateChange = spy;

    // Setting same state again
    brain.setIntent({ state: AvatarBehaviorState.THINKING });
    
    expect(spy).not.toHaveBeenCalled();
  });

  it('should allow duplicate EMOTIONAL state transitions', () => {
    brain.setIntent({ state: AvatarBehaviorState.EMOTIONAL });
    const spy = vi.fn();
    brain.onStateChange = spy;

    // Setting same emotional state again (e.g. different intensity)
    brain.setIntent({ state: AvatarBehaviorState.EMOTIONAL });
    
    expect(spy).toHaveBeenCalled();
  });

  it('should revert to IDLE after timeout', () => {
    vi.useFakeTimers();
    const now = 1000;
    vi.setSystemTime(now);

    brain.setIntent({ state: AvatarBehaviorState.TALKING, duration: 2000 });
    expect(brain.getState()).toBe(AvatarBehaviorState.TALKING);

    // Fast-forward time
    vi.advanceTimersByTime(2500);
    brain.update(now + 2500);

    expect(brain.getState()).toBe(AvatarBehaviorState.IDLE);
    vi.useRealTimers();
  });
});
