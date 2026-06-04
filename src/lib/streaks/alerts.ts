export type StreakAlert =
  | {
      type: "freeze_used";
      userId: string;
      streakId: string;
      streakName: string;
      missedDate: string;
      freezesLeft: number;
      currentStreak: number;
    }
  | {
      type: "streak_reset";
      userId: string;
      streakId: string;
      streakName: string;
      missedDate: string;
      finalStreak: number;
    };

export type ProcessMissedDaysResult = {
  freezesApplied: number;
  resets: number;
  alerts: StreakAlert[];
};
