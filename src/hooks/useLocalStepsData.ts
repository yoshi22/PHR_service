// Local steps data hook - placeholder implementation

export const useLocalStepsData = () => {
  console.log('useLocalStepsData hook - not implemented');
  return {
    stepsData: [],
    loading: false,
    error: null,
    refetch: () => Promise.resolve()
  };
};