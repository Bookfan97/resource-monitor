import {
    ResponsiveContainer,
    AreaChart,
    CartesianGrid,
    Area,
    XAxis,
    YAxis,
} from 'recharts';

type BaseChartProps = {
    data: { value: number | undefined }[];
    fill: string;
    stroke: string;
    hideGrid?: boolean;
};

export function BaseChart(props: BaseChartProps) {
    return (
        <ResponsiveContainer width={'100%'} height={'100%'}>
            <AreaChart data={props.data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                {!props.hideGrid && <CartesianGrid stroke="#333" fill="#1C1C1C" />}
                <YAxis domain={[0, 100]} hide />
                <XAxis hide />
                <Area
                    fillOpacity={0.2}
                    fill={props.fill}
                    stroke={props.stroke}
                    strokeWidth={1.5}
                    type="linear"
                    dataKey="value"
                    isAnimationActive={false}
                    connectNulls
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}