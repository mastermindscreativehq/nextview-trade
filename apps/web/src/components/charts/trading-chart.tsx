"use client";

import * as React from "react";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  createTextWatermark,
  ColorType,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
} from "lightweight-charts";
import type { Candle, Timeframe } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import type { UTCTimestamp } from "lightweight-charts";

export interface TradingChartProps {
  symbol: string;
  candles: Candle[];
  timeframe?: Timeframe;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const CHART_COLORS = {
  up: "rgba(34, 197, 94, 0.9)",
  down: "rgba(239, 68, 68, 0.9)",
  volumeUp: "rgba(34, 197, 94, 0.25)",
  volumeDown: "rgba(239, 68, 68, 0.25)",
  grid: "rgba(42, 42, 56, 0.4)",
  crosshair: "rgba(148, 148, 168, 0.6)",
  text: "rgba(92, 92, 114, 1)",
};

export function TradingChart({
  symbol,
  candles,
  loading,
  error,
  onRetry,
}: TradingChartProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const chartRef = React.useRef<IChartApi | null>(null);
  const candleRef = React.useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeRef = React.useRef<ISeriesApi<"Histogram"> | null>(null);

  React.useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: CHART_COLORS.text,
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 11,
        panes: {
          separatorColor: CHART_COLORS.grid,
          separatorHoverColor: CHART_COLORS.grid,
          enableResize: false,
        },
      },
      grid: {
        vertLines: { color: CHART_COLORS.grid },
        horzLines: { color: CHART_COLORS.grid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: CHART_COLORS.crosshair,
          labelBackgroundColor: "rgba(42, 42, 56, 1)",
        },
        horzLine: {
          color: CHART_COLORS.crosshair,
          labelBackgroundColor: "rgba(42, 42, 56, 1)",
        },
      },
      rightPriceScale: {
        borderColor: CHART_COLORS.grid,
        scaleMargins: { top: 0.08, bottom: 0.08 },
      },
      timeScale: {
        borderColor: CHART_COLORS.grid,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 4,
      },
    });

    createTextWatermark(chart.panes()[0], {
      horzAlign: "center",
      vertAlign: "center",
      lines: [
        {
          text: `${symbol} · PAPER`,
          color: "rgba(90, 90, 110, 0.18)",
          fontSize: 42,
          fontFamily: "Inter, sans-serif",
          fontStyle: "bold",
        },
      ],
    });

    const candlesSeries = chart.addSeries(CandlestickSeries, {
      upColor: CHART_COLORS.up,
      downColor: CHART_COLORS.down,
      borderVisible: false,
      wickUpColor: CHART_COLORS.up,
      wickDownColor: CHART_COLORS.down,
      priceScaleId: "right",
    });

    const volumeSeries = chart.addSeries(
      HistogramSeries,
      {
        priceFormat: { type: "volume" },
        priceScaleId: "",
      },
      1
    );
    chart.panes()[1].setHeight(80);

    candleRef.current = candlesSeries;
    volumeRef.current = volumeSeries;
    chartRef.current = chart;

    return () => {
      chartRef.current = null;
      candleRef.current = null;
      volumeRef.current = null;
      chart.remove();
    };
  }, [symbol]);

  React.useEffect(() => {
    if (!candleRef.current || !volumeRef.current) return;
    if (candles.length === 0) return;

    candleRef.current.setData(
      candles.map((c) => ({
        time: c.time as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );
    volumeRef.current.setData(
      candles.map((c) => ({
        time: c.time as UTCTimestamp,
        value: c.volume,
        color: c.close >= c.open ? CHART_COLORS.volumeUp : CHART_COLORS.volumeDown,
      }))
    );
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  if (loading) {
    return (
      <div className="flex h-full min-h-[360px] flex-col gap-2 p-4" role="status" aria-label="Loading chart">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full min-h-[360px] flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-sm font-medium text-text-primary">Unable to load chart</p>
        <p className="text-sm text-text-secondary">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-elevated"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  if (candles.length === 0) {
    return (
      <div className="flex h-full min-h-[360px] items-center justify-center">
        <p className="text-sm text-text-muted">No chart data available for {symbol}.</p>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[360px] w-full">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}