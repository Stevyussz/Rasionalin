import { describe, expect, it } from "vitest";
import { getComboTier } from "../src/components/feedback/ComboCelebration";
import {
  isSoundEnabled,
  playCelebrationFanfare,
  playCheckSound,
  playCorrectSound,
  playHintSound,
  playStreakSound,
  playTapSound,
  playWrongSound,
  unlockAudioContext,
} from "../src/infrastructure/audio/sound-effects";

describe("Combo Celebration Tiers & Safe Audio SFX Helpers", () => {
  it("maps streaks into motivating tiered combo badges cleanly", () => {
    expect(getComboTier(0)).toBeNull();
    expect(getComboTier(1)).toBeNull();
    expect(getComboTier(2)?.tierKey).toBe("double");
    expect(getComboTier(2)?.badgeText).toBe("2x");
    expect(getComboTier(3)?.tierKey).toBe("triple");
    expect(getComboTier(3)?.title).toContain("TRIPLE COMBO");
    expect(getComboTier(4)?.tierKey).toBe("quadra");
    expect(getComboTier(5)?.tierKey).toBe("penta");
    expect(getComboTier(8)?.tierKey).toBe("godlike");
    expect(getComboTier(8)?.badgeText).toBe("8x");
  });

  it("never throws when called in SSR / non-browser environments", () => {
    expect(isSoundEnabled()).toBe(true);
    expect(() => {
      unlockAudioContext();
      playTapSound();
      playHintSound();
      playCheckSound();
      playCorrectSound();
      playWrongSound();
      playStreakSound(2);
      playStreakSound(3);
      playStreakSound(5);
      playCelebrationFanfare();
    }).not.toThrow();
  });
});
