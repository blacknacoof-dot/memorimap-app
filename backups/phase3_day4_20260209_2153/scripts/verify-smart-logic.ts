import { getSmartDescription, getSmartFeatures } from '../lib/facilityUtils';
import { Facility } from '../types';

const mockFacilities: Partial<Facility>[] = [
    {
        name: '(유)현대장례식장',
        type: 'funeral',
        address: '서울특별시 중구 세종대로 14',
    },
    {
        name: '분당메모리얼파크',
        type: 'park',
        address: '경기도 성남시 분당구 새나리로 79',
    },
    {
        name: '펫로스 케어',
        type: 'pet',
        address: '부산광역시 강서구',
    }
];

console.log('🧪 Smart Data Logic Verification Test\n');

mockFacilities.forEach(f => {
    const facility = f as Facility;
    console.log(`Facility: ${facility.name}`);
    console.log(`- Description: ${getSmartDescription(facility)}`);
    console.log(`- Features: ${getSmartFeatures(facility).join(', ')}`);
    console.log('-----------------------------------');
});
