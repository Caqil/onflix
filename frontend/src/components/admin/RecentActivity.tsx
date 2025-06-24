"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Mock data - replace with real API data
const recentActivity = [
  {
    id: 1,
    user: "John Doe",
    avatar: "",
    action: "subscribed to Premium plan",
    time: "2 hours ago",
  },
  {
    id: 2,
    user: "Jane Smith",
    avatar: "",
    action: "uploaded new content",
    time: "4 hours ago",
  },
  {
    id: 3,
    user: "Bob Johnson",
    avatar: "",
    action: "canceled subscription",
    time: "6 hours ago",
  },
  {
    id: 4,
    user: "Alice Brown",
    avatar: "",
    action: "updated profile",
    time: "8 hours ago",
  },
];

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-4">
              <Avatar className="h-8 w-8">
                <AvatarImage src={activity.avatar} alt={activity.user} />
                <AvatarFallback>
                  {activity.user
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <p className="text-sm">
                  <span className="font-medium">{activity.user}</span>{" "}
                  {activity.action}
                </p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
