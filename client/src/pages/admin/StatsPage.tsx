import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  ClipboardList,
  Clock,
  Wrench,
  CheckCircle2,
} from 'lucide-react';
import { statsApi } from '@client/src/api';
import { FAULT_TYPE_LABELS, type OrderStatsResponse, type FaultType } from '@shared/api.interface';
import { Card, CardContent, CardHeader, CardTitle } from '@client/src/components/ui/card';

let ReactECharts: any = null;
let echartsImportError = false;

try {
  const echartsModule = require('echarts-for-react');
  ReactECharts = echartsModule.default || echartsModule;
} catch {
  try {
    const echartsModule = require('echarts');
    const ReactEChartsCompat: React.FC<{ option: any; style?: React.CSSProperties }> = ({ option, style }) => {
      const chartRef = React.useRef<HTMLDivElement>(null);
      const chartInstanceRef = React.useRef<any>(null);
      React.useEffect(() => {
        if (chartRef.current && !chartInstanceRef.current) {
          chartInstanceRef.current = echartsModule.init(chartRef.current);
        }
        if (chartInstanceRef.current) {
          chartInstanceRef.current.setOption(option);
        }
        return () => {
          if (chartInstanceRef.current) {
            chartInstanceRef.current.dispose();
            chartInstanceRef.current = null;
          }
        };
      }, [option]);
      return <div ref={chartRef} style={style || { width: '100%', height: '300px' }} />;
    };
    ReactECharts = ReactEChartsCompat;
  } catch {
    echartsImportError = true;
  }
}

const CHART_COLORS = [
  'hsl(222 82% 56%)',
  'hsl(174 77% 46%)',
  'hsl(46 100% 52%)',
  'hsl(27 92% 49%)',
  'hsl(292 54% 76%)',
  'hsl(340 76% 60%)',
];

const StatsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<OrderStatsResponse | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await statsApi.getOrderStats();
      setStats(data);
    } catch (error: any) {
      toast.error(error.message || '获取统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statCards = [
    {
      label: '总工单数',
      value: stats?.total ?? 0,
      icon: ClipboardList,
      color: 'bg-primary/10 text-primary',
    },
    {
      label: '已完成',
      value: stats?.completed ?? 0,
      icon: CheckCircle2,
      color: 'bg-emerald-100 text-emerald-600',
    },
    {
      label: '待处理',
      value: stats?.pending ?? 0,
      icon: Clock,
      color: 'bg-amber-100 text-amber-600',
    },
    {
      label: '维修中',
      value: stats?.repairing ?? 0,
      icon: Wrench,
      color: 'bg-indigo-100 text-indigo-600',
    },
  ];

  const getFaultTypeOption = () => {
    if (!stats) return {};
    const data = stats.byFaultType.map((item, idx) => ({
      name: FAULT_TYPE_LABELS[item.type as FaultType],
      value: item.count,
      itemStyle: { color: CHART_COLORS[idx % CHART_COLORS.length] },
    }));
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        textStyle: { fontSize: 12 },
      },
      series: [
        {
          name: '故障类型',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 4,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: 14, fontWeight: 'bold' },
          },
          data,
        },
      ],
    };
  };

  const getRepairerOption = () => {
    if (!stats) return {};
    const names = stats.byRepairer.map((item) => item.repairerName);
    const values = stats.byRepairer.map((item) => item.count);
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: names,
        axisLabel: { fontSize: 12, interval: 0, rotate: names.length > 5 ? 30 : 0 },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        axisLabel: { fontSize: 12 },
      },
      series: [
        {
          name: '完成工单',
          type: 'bar',
          data: values.map((val, idx) => ({
            value: val,
            itemStyle: { color: CHART_COLORS[idx % CHART_COLORS.length] },
          })),
          barWidth: '40%',
          itemStyle: { borderRadius: [4, 4, 0, 0] },
        },
      ],
    };
  };

  const renderFaultTypeBarFallback = () => {
    if (!stats) return null;
    const total = stats.byFaultType.reduce((sum, item) => sum + item.count, 0) || 1;
    return (
      <div className="space-y-3">
        {stats.byFaultType.map((item, idx) => {
          const percent = (item.count / total) * 100;
          return (
            <div key={item.type}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-700">
                  {FAULT_TYPE_LABELS[item.type as FaultType]}
                </span>
                <span className="text-muted-foreground">
                  {item.count} 单 ({percent.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${percent}%`,
                    backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderRepairerBarFallback = () => {
    if (!stats || stats.byRepairer.length === 0) {
      return <div className="text-muted-foreground text-center py-8">暂无数据</div>;
    }
    const maxCount = Math.max(...stats.byRepairer.map((item) => item.count), 1);
    return (
      <div className="space-y-3">
        {stats.byRepairer.map((item, idx) => {
          const percent = (item.count / maxCount) * 100;
          return (
            <div key={item.repairerId}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-700">{item.repairerName}</span>
                <span className="text-muted-foreground">{item.count} 单</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${percent}%`,
                    backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">数据统计</h1>
        <p className="text-sm text-muted-foreground mt-1">查看工单数据概览和分析</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="rounded-lg">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{card.label}</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">
                      {loading ? '--' : card.value}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${card.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="text-lg">故障类型报修占比</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                加载中...
              </div>
            ) : !stats || stats.byFaultType.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                暂无数据
              </div>
            ) : echartsImportError ? (
              <div className="py-4">{renderFaultTypeBarFallback()}</div>
            ) : ReactECharts ? (
              <ReactECharts option={getFaultTypeOption()} style={{ height: '300px', width: '100%' }} />
            ) : (
              <div className="py-4">{renderFaultTypeBarFallback()}</div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="text-lg">维修人员完成工单数量</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                加载中...
              </div>
            ) : !stats || stats.byRepairer.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                暂无数据
              </div>
            ) : echartsImportError ? (
              <div className="py-4">{renderRepairerBarFallback()}</div>
            ) : ReactECharts ? (
              <ReactECharts option={getRepairerOption()} style={{ height: '300px', width: '100%' }} />
            ) : (
              <div className="py-4">{renderRepairerBarFallback()}</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StatsPage;
