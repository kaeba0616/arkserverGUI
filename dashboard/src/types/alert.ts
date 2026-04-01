export type AlertMetric = "cpu" | "memory" | "players";
export type AlertOperator = "gt" | "lt" | "eq";

export interface AlertRule {
  id: number;
  metric: AlertMetric;
  operator: AlertOperator;
  threshold: number;
  enabled: boolean;
  createdAt: number;
}

export interface AlertEvent {
  id: number;
  ruleId: number;
  timestamp: number;
  value: number;
  acknowledged: boolean;
}
