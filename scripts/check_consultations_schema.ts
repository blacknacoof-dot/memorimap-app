import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkConsultationsSchema() {
  console.log('=== consultations 테이블 스키마 확인 ===\n');

  // 1. 컬럼 정보 조회
  const { data: columns, error: colError } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type, is_nullable, column_default')
    .eq('table_name', 'consultations')
    .eq('table_schema', 'public')
    .order('ordinal_position');

  if (colError) {
    console.error('컬럼 조회 오류:', colError);
    return;
  }

  console.log('📋 컬럼 목록:');
  console.log('-'.repeat(80));
  columns?.forEach((col) => {
    const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
    const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
    console.log(`  ${col.column_name.padEnd(30)} ${col.data_type.padEnd(20)} ${nullable}${defaultVal}`);
  });

  // 2. 외래 키 정보 조회
  console.log('\n\n🔗 외래 키 정보:');
  console.log('-'.repeat(80));
  const { data: fkeys, error: fkError } = await supabase
    .from('information_schema.table_constraints')
    .select(`
      constraint_name,
      constraint_type
    `)
    .eq('table_name', 'consultations')
    .eq('table_schema', 'public')
    .eq('constraint_type', 'FOREIGN KEY');

  if (fkError) {
    console.error('외래 키 조회 오류:', fkError);
  } else {
    console.log(fkeys?.length ? fkeys : '  외래 키 없음');
  }

  // 3. 인덱스 정보 조회
  console.log('\n\n📊 인덱스 정보:');
  console.log('-'.repeat(80));
  const { data: indexes, error: idxError } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'consultations' AND schemaname = 'public'
    `
  });

  if (idxError) {
    // RPC가 없는 경우 대체 방법
    console.log('  인덱스 정보는 pg_indexes를 직접 쿼리해야 합니다.');
  } else {
    console.log(indexes || '  인덱스 없음');
  }

  // 4. 샘플 데이터 확인
  console.log('\n\n📝 샘플 데이터 (최근 3개):');
  console.log('-'.repeat(80));
  const { data: samples, error: sampleError } = await supabase
    .from('consultations')
    .select('*')
    .limit(3)
    .order('created_at', { ascending: false });

  if (sampleError) {
    console.error('샘플 데이터 조회 오류:', sampleError);
  } else if (samples && samples.length > 0) {
    samples.forEach((row, i) => {
      console.log(`\n  [Row ${i + 1}]`);
      Object.entries(row).forEach(([key, value]) => {
        const valStr = value === null ? 'NULL' : String(value).substring(0, 50);
        console.log(`    ${key}: ${valStr}`);
      });
    });
  } else {
    console.log('  데이터 없음');
  }

  // 5. facility_id 관련 컬럼 특별 확인
  console.log('\n\n🔍 facility 관련 컬럼:');
  console.log('-'.repeat(80));
  const facilityCols = columns?.filter(col => 
    col.column_name.toLowerCase().includes('facility')
  );
  
  if (facilityCols && facilityCols.length > 0) {
    facilityCols.forEach(col => {
      console.log(`  ✓ ${col.column_name} (${col.data_type})`);
    });
  } else {
    console.log('  facility 관련 컬럼을 찾을 수 없습니다!');
    console.log('  가능한 컬럼명:');
    columns?.forEach(col => {
      if (col.column_name.includes('id') || col.column_name.includes('memorial')) {
        console.log(`    - ${col.column_name}`);
      }
    });
  }
}

checkConsultationsSchema();
