import React from 'react';

interface StatsProps {
    stats: {
        funeral_home: number;
        columbarium: number;
        cemetery: number;
        sea_burial: number;
        natural_burial: number;
        pet_funeral: number;
        total: number;
    };
}

export default function Stats({ stats }: StatsProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-600">장례식장</p>
                <p className="text-2xl font-bold text-blue-600">{stats.funeral_home}</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-600">봉안시설</p>
                <p className="text-2xl font-bold text-blue-600">{stats.columbarium}</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-600">공원묘지</p>
                <p className="text-2xl font-bold text-blue-600">{stats.cemetery}</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-600">해양장</p>
                <p className="text-2xl font-bold text-blue-600">{stats.sea_burial}</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-600">자연장</p>
                <p className="text-2xl font-bold text-blue-600">{stats.natural_burial}</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-600">동물장례</p>
                <p className="text-2xl font-bold text-blue-600">{stats.pet_funeral}</p>
            </div>

            <div className="col-span-2 md:col-span-3 bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">전체 시설</p>
                <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
            </div>
        </div>
    );
}
