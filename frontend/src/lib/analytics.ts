/**
 * Calculate linear regression for a set of values
 * Returns the slope (m) and y-intercept (b) for y = mx + b
 */
export function calculateLinearRegression(values: number[]) {
    const n = values.length
    if (n === 0) return { m: 0, b: 0 }

    const xSum = (n * (n - 1)) / 2
    const ySum = values.reduce((sum, val) => sum + val, 0)

    // Calculate Sum(x*y)
    let xySum = 0
    for (let i = 0; i < n; i++) {
        xySum += i * values[i]
    }

    // Calculate Sum(x^2)
    let xxSum = 0
    for (let i = 0; i < n; i++) {
        xxSum += i * i
    }

    const m = (n * xySum - xSum * ySum) / (n * xxSum - xSum * xSum)
    const b = (ySum - m * xSum) / n

    return { m, b }
}

/**
 * Generate forecast points based on linear regression
 * @param data Array of historical values
 * @param periods Number of future periods to forecast
 * @returns Array of forecasted values (including the connection point)
 */
export function generateForecast(data: number[], periods: number = 7): number[] {
    if (data.length < 2) return []

    const { m, b } = calculateLinearRegression(data)
    const lastIndex = data.length - 1
    const forecast: number[] = []

    // Start from the next index
    for (let i = 1; i <= periods; i++) {
        const x = lastIndex + i
        const y = m * x + b
        forecast.push(y)
    }

    return forecast
}
