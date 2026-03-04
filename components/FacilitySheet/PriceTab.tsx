import React from 'react';
import { Facility } from '../../types';
import type { DbPackage } from './useFacilitySheet';

interface Props {
  facility: Facility;
  dbPackages: DbPackage[];
}

export const PriceTab: React.FC<Props> = ({ facility, dbPackages }) => {
  const renderPrice = (rawPrice: string | number | undefined): string => {
    const priceStr = String(rawPrice ?? '');
    const priceNum = parseInt(priceStr.replace(/[^0-9]/g, ''));
    const minPriceThreshold = 1000000;

    if (!isNaN(priceNum) && priceNum >= minPriceThreshold) {
      return `${Math.round(priceNum / 10000).toLocaleString()}만원`;
    }
    if (priceStr.includes('만원')) {
      const match = priceStr.match(/(\d+)/);
      if (match && parseInt(match[1]) * 10000 < minPriceThreshold) return '-';
      return priceStr;
    }
    if (priceStr.includes('문의') || priceStr.includes('상담')) return '상담 문의';
    return '-';
  };

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg mb-4">
        {facility.type === 'funeral' ? '가격표' : '분양 가격표'}
      </h3>

      {dbPackages.length > 0 ? (
        <div className="space-y-3">
          {dbPackages.map((pkg) => (
            <div key={pkg.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">{pkg.name}</h4>
                  {pkg.category && (
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full mt-1 inline-block">{pkg.category}</span>
                  )}
                </div>
                <span className="text-blue-600 font-black text-lg">
                  {pkg.price_label || (pkg.price ? `${(pkg.price / 10000).toLocaleString()}만원` : '문의')}
                </span>
              </div>
              {pkg.description && <p className="text-xs text-gray-500 mb-2">{pkg.description}</p>}
              {pkg.included_items && pkg.included_items.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {pkg.included_items.map((item, i) => (
                    <span key={i} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">{item}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : facility.priceInfo?.items && facility.priceInfo.items.length > 0 ? (
        <div className="border rounded-xl overflow-hidden text-sm">
          <div className="bg-gray-50 flex font-bold py-2 border-b text-gray-500 text-xs text-center">
            <div className="flex-[2] min-w-0 px-2">품목</div>
            <div className="flex-1 min-w-0 px-2">카테고리</div>
            <div className="flex-[2] min-w-0 px-2">가격</div>
          </div>
          {facility.priceInfo.items.filter((p) => {
            if (facility.type === 'funeral') {
              if (p.item.includes('용품') || p.category.includes('용품')) return false;
              return p.item.includes('빈소') || p.item.includes('접객실');
            }
            return true;
          }).map((p, idx) => (
            <div key={idx} className="flex items-center py-3 border-b last:border-0 hover:bg-gray-50">
              <div className="flex-[2] min-w-0 px-2 text-gray-800 font-medium text-center break-keep text-xs">{p.item}</div>
              <div className="flex-1 min-w-0 px-2 text-gray-400 text-[11px] text-center break-all">
                {(p.category === '1위 기준' ? '기본형' : p.category) || '-'}
              </div>
              <div className="flex-[2] min-w-0 px-2 text-blue-600 text-sm text-center font-bold">
                {renderPrice(p.price)}
              </div>
            </div>
          ))}
        </div>
      ) : facility.prices && facility.prices.length > 0 ? (
        <div className="border rounded-xl overflow-hidden text-sm">
          <div className="bg-gray-50 flex font-bold py-2 border-b text-gray-500 text-xs text-center">
            <div className="w-1/3 px-2">품목</div>
            <div className="w-1/3 px-2">상세</div>
            <div className="w-1/3 px-2">가격</div>
          </div>
          {facility.prices.map((p, idx) => (
            <div key={idx} className="flex items-center py-3 border-b last:border-0 hover:bg-gray-50">
              <div className="w-1/3 px-2 text-gray-800 font-medium text-center text-xs">{p.item || p.type || '-'}</div>
              <div className="w-1/3 px-2 text-gray-400 text-[10px] text-center">
                {(p.detail === '1위 기준' ? '기본형' : p.detail) || '-'}
              </div>
              <div className="w-1/3 px-2 text-blue-600 text-sm text-center font-bold">
                {renderPrice(p.price)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400 text-sm">
          가격 정보가 없습니다. 상담 문의를 이용해주세요.
        </div>
      )}

      <div className="bg-yellow-50 p-3 rounded-lg text-xs text-gray-600 mt-4 leading-relaxed">
        * 상세 견적은 <strong>AI 상담</strong>을 통해 확인하실 수 있습니다.<br />
        * 실제 비용은 사용 시간과 선택 옵션에 따라 달라집니다.
      </div>
    </div>
  );
};
