"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils/cn";

interface WeeklyDataPoint {
  day: string;
  views: number;
  visitors?: number;
}

interface BarChartProps {
  data: WeeklyDataPoint[];
  title?: string;
  className?: string;
}

export function WeeklyBarChart({ data, title, className }: BarChartProps) {
  return (
    <div className={cn("bg-white rounded-lg border border-gray-200 shadow-sm p-6", className)}>
      {title && (
        <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 12, fill: "#6B7280" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#6B7280" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              fontSize: 12,
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
            }}
            formatter={(value: number | undefined) => [(value ?? 0).toLocaleString(), "방문자"]}
          />
          <Bar dataKey="views" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={48} />
          {data[0]?.visitors !== undefined && (
            <Bar dataKey="visitors" fill="#93C5FD" radius={[4, 4, 0, 0]} maxBarSize={48} />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface LineChartComponentProps {
  data: WeeklyDataPoint[];
  title?: string;
  className?: string;
}

export function TrafficLineChart({ data, title, className }: LineChartComponentProps) {
  return (
    <div className={cn("bg-white rounded-lg border border-gray-200 shadow-sm p-6", className)}>
      {title && (
        <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 12, fill: "#6B7280" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#6B7280" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              fontSize: 12,
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
            }}
            formatter={(value: number | undefined) => [(value ?? 0).toLocaleString(), "페이지뷰"]}
          />
          <Line
            type="monotone"
            dataKey="views"
            stroke="#2563EB"
            strokeWidth={2}
            dot={{ r: 3, fill: "#2563EB" }}
            activeDot={{ r: 5 }}
          />
          {data[0]?.visitors !== undefined && (
            <Line
              type="monotone"
              dataKey="visitors"
              stroke="#93C5FD"
              strokeWidth={2}
              dot={{ r: 3, fill: "#93C5FD" }}
              strokeDasharray="4 2"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface PieDataPoint {
  name: string;
  value: number;
  color: string;
}

interface AIPieChartProps {
  data: PieDataPoint[];
  title?: string;
  className?: string;
}

export function AIPieChart({ data, title, className }: AIPieChartProps) {
  return (
    <div className={cn("bg-white rounded-lg border border-gray-200 shadow-sm p-6", className)}>
      {title && (
        <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value: number | undefined) => [`${value ?? 0}건`, ""]}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span style={{ fontSize: 12, color: "#6B7280" }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
