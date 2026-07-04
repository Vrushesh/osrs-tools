const REFRESH_WINDOW_SECONDS = 60;

export type RefreshState = {
  secondsSinceFetch: number;
  secondsUntilRefresh: number;
  canFetch: boolean;
};

export function getRefreshState(
  fetchedAtSeconds: number,
  nowSeconds: number,
): RefreshState {
  const secondsSinceFetch = Math.max(0, nowSeconds - fetchedAtSeconds);
  const secondsUntilRefresh = Math.max(
    0,
    REFRESH_WINDOW_SECONDS - secondsSinceFetch,
  );

  return {
    secondsSinceFetch,
    secondsUntilRefresh,
    canFetch: secondsUntilRefresh === 0,
  };
}

export function shouldFetchOnManualRefresh(state: RefreshState) {
  return state.canFetch;
}
