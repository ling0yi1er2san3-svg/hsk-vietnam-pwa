import type { CharacterMetadata } from '../types/vocabulary';

const now = 0;

// Starter dataset: intentionally small and auditable. It proves the Phase 6–7
// architecture without pretending to be a complete Han-Viet/radical dictionary.
export const STARTER_CHARACTERS: CharacterMetadata[] = [
  { hanzi: '学', traditional: '學', pinyin: ['xué'], hanViet: ['học'], radical: '子', radicalMeaningVi: 'con, trẻ', strokeCount: 8, components: ['⺍', '冖', '子'], semanticComponent: '子', source: 'starter', updatedAt: now },
  { hanzi: '习', traditional: '習', pinyin: ['xí'], hanViet: ['tập'], radical: '乙', radicalMeaningVi: 'ất', strokeCount: 3, components: ['习'], source: 'starter', updatedAt: now },
  { hanzi: '生', pinyin: ['shēng'], hanViet: ['sinh'], radical: '生', radicalMeaningVi: 'sinh, sống', strokeCount: 5, components: ['生'], source: 'starter', updatedAt: now },
  { hanzi: '校', pinyin: ['xiào', 'jiào'], hanViet: ['hiệu', 'giáo'], radical: '木', radicalMeaningVi: 'cây, gỗ', strokeCount: 10, components: ['木', '交'], semanticComponent: '木', phoneticComponent: '交', source: 'starter', updatedAt: now },
  { hanzi: '中', pinyin: ['zhōng', 'zhòng'], hanViet: ['trung', 'trúng'], radical: '丨', radicalMeaningVi: 'nét sổ', strokeCount: 4, components: ['中'], source: 'starter', updatedAt: now },
  { hanzi: '国', traditional: '國', pinyin: ['guó'], hanViet: ['quốc'], radical: '囗', radicalMeaningVi: 'vi', strokeCount: 8, components: ['囗', '玉'], semanticComponent: '囗', source: 'starter', updatedAt: now },
  { hanzi: '人', pinyin: ['rén'], hanViet: ['nhân'], radical: '人', radicalMeaningVi: 'người', strokeCount: 2, components: ['人'], source: 'starter', updatedAt: now },
  { hanzi: '女', pinyin: ['nǚ'], hanViet: ['nữ'], radical: '女', radicalMeaningVi: 'nữ, phụ nữ', strokeCount: 3, components: ['女'], source: 'starter', updatedAt: now },
  { hanzi: '马', traditional: '馬', pinyin: ['mǎ'], hanViet: ['mã'], radical: '马', radicalMeaningVi: 'ngựa', strokeCount: 3, components: ['马'], source: 'starter', updatedAt: now },
  { hanzi: '妈', traditional: '媽', pinyin: ['mā'], hanViet: ['ma'], radical: '女', radicalMeaningVi: 'nữ, phụ nữ', strokeCount: 6, components: ['女', '马'], semanticComponent: '女', phoneticComponent: '马', source: 'starter', updatedAt: now },
  { hanzi: '姐', pinyin: ['jiě'], hanViet: ['tỷ'], radical: '女', radicalMeaningVi: 'nữ, phụ nữ', strokeCount: 8, components: ['女', '且'], semanticComponent: '女', phoneticComponent: '且', source: 'starter', updatedAt: now },
  { hanzi: '妹', pinyin: ['mèi'], hanViet: ['muội'], radical: '女', radicalMeaningVi: 'nữ, phụ nữ', strokeCount: 8, components: ['女', '未'], semanticComponent: '女', phoneticComponent: '未', source: 'starter', updatedAt: now },
  { hanzi: '她', pinyin: ['tā'], hanViet: ['tha'], radical: '女', radicalMeaningVi: 'nữ, phụ nữ', strokeCount: 6, components: ['女', '也'], semanticComponent: '女', phoneticComponent: '也', source: 'starter', updatedAt: now },
  { hanzi: '奶', pinyin: ['nǎi'], hanViet: ['nãi'], radical: '女', radicalMeaningVi: 'nữ, phụ nữ', strokeCount: 5, components: ['女', '乃'], semanticComponent: '女', phoneticComponent: '乃', source: 'starter', updatedAt: now },
  { hanzi: '好', pinyin: ['hǎo', 'hào'], hanViet: ['hảo', 'hiếu'], radical: '女', radicalMeaningVi: 'nữ, phụ nữ', strokeCount: 6, components: ['女', '子'], semanticComponent: '女', source: 'starter', updatedAt: now },
  { hanzi: '姓', pinyin: ['xìng'], hanViet: ['tính'], radical: '女', radicalMeaningVi: 'nữ, phụ nữ', strokeCount: 8, components: ['女', '生'], semanticComponent: '女', phoneticComponent: '生', source: 'starter', updatedAt: now },
  { hanzi: '青', pinyin: ['qīng'], hanViet: ['thanh'], radical: '青', radicalMeaningVi: 'xanh', strokeCount: 8, components: ['青'], source: 'starter', updatedAt: now },
  { hanzi: '请', traditional: '請', pinyin: ['qǐng'], hanViet: ['thỉnh'], radical: '讠', radicalMeaningVi: 'lời nói', strokeCount: 10, components: ['讠', '青'], semanticComponent: '讠', phoneticComponent: '青', source: 'starter', updatedAt: now, noteVi: '讠 gợi nghĩa liên quan lời nói; 青 gợi âm.' },
  { hanzi: '清', pinyin: ['qīng'], hanViet: ['thanh'], radical: '氵', radicalMeaningVi: 'nước', strokeCount: 11, components: ['氵', '青'], semanticComponent: '氵', phoneticComponent: '青', source: 'starter', updatedAt: now, noteVi: '氵 gợi nghĩa liên quan nước; 青 gợi âm.' },
  { hanzi: '情', pinyin: ['qíng'], hanViet: ['tình'], radical: '忄', radicalMeaningVi: 'tâm, cảm xúc', strokeCount: 11, components: ['忄', '青'], semanticComponent: '忄', phoneticComponent: '青', source: 'starter', updatedAt: now, noteVi: '忄 gợi nghĩa liên quan cảm xúc; 青 gợi âm.' },
  { hanzi: '晴', pinyin: ['qíng'], hanViet: ['tình'], radical: '日', radicalMeaningVi: 'mặt trời, ngày', strokeCount: 12, components: ['日', '青'], semanticComponent: '日', phoneticComponent: '青', source: 'starter', updatedAt: now, noteVi: '日 gợi nghĩa liên quan thời tiết/ánh sáng; 青 gợi âm.' },
  { hanzi: '精', pinyin: ['jīng'], hanViet: ['tinh'], radical: '米', radicalMeaningVi: 'gạo', strokeCount: 14, components: ['米', '青'], semanticComponent: '米', phoneticComponent: '青', source: 'starter', updatedAt: now },
  { hanzi: '言', pinyin: ['yán'], hanViet: ['ngôn'], radical: '言', radicalMeaningVi: 'lời nói', strokeCount: 7, components: ['言'], source: 'starter', updatedAt: now },
  { hanzi: '水', pinyin: ['shuǐ'], hanViet: ['thủy'], radical: '水', radicalMeaningVi: 'nước', strokeCount: 4, components: ['水'], source: 'starter', updatedAt: now },
  { hanzi: '心', pinyin: ['xīn'], hanViet: ['tâm'], radical: '心', radicalMeaningVi: 'tim, tâm', strokeCount: 4, components: ['心'], source: 'starter', updatedAt: now },
  { hanzi: '日', pinyin: ['rì'], hanViet: ['nhật'], radical: '日', radicalMeaningVi: 'mặt trời, ngày', strokeCount: 4, components: ['日'], source: 'starter', updatedAt: now },
  { hanzi: '米', pinyin: ['mǐ'], hanViet: ['mễ'], radical: '米', radicalMeaningVi: 'gạo', strokeCount: 6, components: ['米'], source: 'starter', updatedAt: now },
  { hanzi: '木', pinyin: ['mù'], hanViet: ['mộc'], radical: '木', radicalMeaningVi: 'cây, gỗ', strokeCount: 4, components: ['木'], source: 'starter', updatedAt: now }
];
