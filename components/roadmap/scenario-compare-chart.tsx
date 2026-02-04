'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { DividendGoalScenario } from '../../lib/simulations/types';
import { formatCurrencyJPY } from '../../lib/dashboard/format';
import { useScenarioCompareStore } from '../../stores/scenario-compare-store';
import { Card, CardContent } from '../ui/card';

type ChartDataPoint = {
  year: number;
  [key: string]: number | null;
};

type ScenarioSeriesConfig = {
  key: string;
  name: string;
  color: string;
};

const chartColors = ['#2563eb', '#16a34a', '#f97316'];

const formatYearLabel = (year: number): string => `${year}年`;

const formatCurrency = (value: number): string => formatCurrencyJPY(value);

const buildScenarioKeys = (
  scenarios: DividendGoalScenario[]
): ScenarioSeriesConfig[] => {
  return scenarios.map((scenario, index) => ({
    key: `scenario_${index}`,
    name: scenario.name,
    color: chartColors[index % chartColors.length],
  }));
};

const buildSeriesData = (
  scenarios: DividendGoalScenario[],
  seriesConfigs: ScenarioSeriesConfig[]
): ChartDataPoint[] => {
  const dataByYear = new Map<number, ChartDataPoint>();

  scenarios.forEach((scenario, index) => {
    const key = seriesConfigs[index]?.key;
    if (!key) {
      return;
    }

    const series = Array.isArray(scenario.series) ? scenario.series : [];
    series.forEach((point) => {
      const current = dataByYear.get(point.year) ?? { year: point.year };
      current[key] = point.annual_dividend;
      dataByYear.set(point.year, current);
    });
  });

  return Array.from(dataByYear.values()).sort((a, b) => a.year - b.year);
};

export function ScenarioCompareChart() {
  const response = useScenarioCompareStore((state) => state.response);
  const isLoading = useScenarioCompareStore((state) => state.isLoading);

  const scenarios = Array.isArray(response?.scenarios)
    ? response?.scenarios
    : [];
  const scenarioKeys = buildScenarioKeys(scenarios);
  const seriesData = buildSeriesData(scenarios, scenarioKeys);

  return (
    <Card>
      <CardContent className="py-6">
        {isLoading && (
          <p className="text-sm text-muted-foreground">計算中...</p>
        )}
        {!isLoading && seriesData.length === 0 && (
          <p className="text-sm text-muted-foreground">
            比較データがまだありません
          </p>
        )}
        {!isLoading && seriesData.length > 0 && (
          <div data-testid="scenario-compare-chart">
            <div className="mb-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
              {scenarioKeys.map((scenario) => (
                <div
                  key={scenario.key}
                  className="flex items-center gap-2"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: scenario.color }}
                  />
                  <span>{scenario.name}</span>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={seriesData}
                margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="year"
                  tickFormatter={(value) => formatYearLabel(Number(value))}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatCurrency(Number(value))}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  labelFormatter={(label) => formatYearLabel(Number(label))}
                />
                {scenarioKeys.map((scenario) => (
                  <Line
                    key={scenario.key}
                    type="monotone"
                    dataKey={scenario.key}
                    name={scenario.name}
                    stroke={scenario.color}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    data-testid="scenario-compare-line"
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
