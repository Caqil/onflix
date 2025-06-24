"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Mock data - replace with real API data
const analyticsData = [
  { name: "Jan", users: 400, revenue: 2400 },
  { name: "Feb", users: 300, revenue: 1398 },
  { name: "Mar", users: 200, revenue: 9800 },
  { name: "Apr", users: 278, revenue: 3908 },
  { name: "May", users: 189, revenue: 4800 },
  { name: "Jun", users: 239, revenue: 3800 },
];

export function AnalyticsCharts() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Growth & Revenue</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analyticsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="users"
              stroke="#dc2626"
              strokeWidth={2}
              name="Users"
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#059669"
              strokeWidth={2}
              name="Revenue"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
