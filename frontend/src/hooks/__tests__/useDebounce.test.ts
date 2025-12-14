import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
    jest.useFakeTimers();

    it('should return initial value immediately', () => {
        const { result } = renderHook(() => useDebounce('initial', 500));
        expect(result.current).toBe('initial');
    });

    it('should debounce value updates', () => {
        const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
            initialProps: { value: 'initial', delay: 500 },
        });

        // Update value
        rerender({ value: 'updated', delay: 500 });

        // Value should not update immediately
        expect(result.current).toBe('initial');

        // Fast forward time
        act(() => {
            jest.advanceTimersByTime(500);
        });

        expect(result.current).toBe('updated');
    });
});
