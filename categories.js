// categories.js - Dicionário de categorias, emojis e detecção inteligente em português
export const CATEGORIES = [
  {
    id: 'hortifruti',
    name: 'Hortifrúti',
    emoji: '🍎',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    keywords: [
      'banana', 'maca', 'maçã', 'laranja', 'limao', 'limão', 'uva', 'morango', 'tomate', 
      'batata', 'cebola', 'alho', 'cenoura', 'alface', 'brocolis', 'brócolis', 'abacaxi', 
      'manga', 'melancia', 'melao', 'melão', 'abacate', 'couve', 'espinafre', 'pepino', 
      'pimentao', 'pimentão', 'mamao', 'mamão', 'tangerina', 'mexerica', 'pera', 'pessego', 
      'pêssego', 'maracuja', 'maracujá', 'beterraba', 'mandioca', 'aipim', 'macaxeira', 
      'chuchu', 'abobrinha', 'abobora', 'abóbora', 'coentro', 'salsa', 'salsinha', 
      'cebolinha', 'hortela', 'hortelã', 'gengibre', 'repolho', 'rucula', 'rúcula',
      'cogumelo', 'champignon', 'kiwi', 'fruta', 'legume', 'verdura', 'maracuja'
    ]
  },
  {
    id: 'acougue',
    name: 'Carnes & Peixes',
    emoji: '🥩',
    color: 'bg-rose-100 text-rose-800 border-rose-200',
    keywords: [
      'carne', 'frango', 'boi', 'picanha', 'alcatra', 'patinho', 'moida', 'moída', 
      'costela', 'linguica', 'linguiça', 'bacon', 'salsicha', 'peixe', 'salmao', 
      'salmão', 'tilapia', 'tilápia', 'camarao', 'camarão', 'file', 'filé', 'bife', 
      'bisteca', 'lombo', 'pernil', 'sobrecoxa', 'coxa', 'peito', 'asa', 'hamburguer', 
      'hambúrguer', 'cupim', 'cordeiro', 'costelinha', 'calabresa', 'atum fresco'
    ]
  },
  {
    id: 'laticinios',
    name: 'Laticínios & Frios',
    emoji: '🥛',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    keywords: [
      'leite', 'queijo', 'presunto', 'mussarela', 'mucarela', 'iogurte', 'manteiga', 
      'requeijao', 'requeijão', 'creme de leite', 'leite condensado', 'nata', 'ricota', 
      'parmesao', 'parmesão', 'mortadela', 'peito de peru', 'salame', 'cheddar', 'ovo', 
      'ovos', 'danone', 'coalhada', 'margarina'
    ]
  },
  {
    id: 'padaria',
    name: 'Padaria & Confeitaria',
    emoji: '🥖',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    keywords: [
      'pao', 'pão', 'frances', 'francês', 'bisnaga', 'torrada', 'torradas', 'bolo', 
      'torta', 'croissant', 'sonho', 'brioche', 'pao de queijo', 'pão de queijo', 
      'biscoito', 'bolacha', 'cookie', 'cookies', 'panetone', 'rosca'
    ]
  },
  {
    id: 'mercearia',
    name: 'Despensa & Grãos',
    emoji: '🌾',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    keywords: [
      'arroz', 'feijao', 'feijão', 'macarrao', 'macarrão', 'espaguete', 'massa', 
      'farinha', 'acucar', 'açúcar', 'sal', 'cafe', 'café', 'oleo', 'óleo', 'azeite', 
      'molho', 'extrato', 'milho', 'ervilha', 'aveia', 'cereal', 'granola', 'atum', 
      'sardinha', 'trigo', 'fermento', 'maionese', 'ketchup', 'mostarda', 'vinagre', 
      'shoyu', 'azeitona', 'miojo', 'lasanha seca', 'canela', 'tempero'
    ]
  },
  {
    id: 'bebidas',
    name: 'Bebidas',
    emoji: '🥤',
    color: 'bg-sky-100 text-sky-800 border-sky-200',
    keywords: [
      'agua', 'água', 'suco', 'refrigerante', 'coca', 'coca-cola', 'fanta', 'guarana', 
      'guaraná', 'cerveja', 'vinho', 'chopp', 'cha', 'chá', 'energetico', 'energético', 
      'vodka', 'gin', 'whisky', 'tonica', 'tônica', 'ice', 'espumante'
    ]
  },
  {
    id: 'limpeza',
    name: 'Limpeza',
    emoji: '🧹',
    color: 'bg-teal-100 text-teal-800 border-teal-200',
    keywords: [
      'sabao', 'sabão', 'amaciante', 'detergente', 'desinfetante', 'agua sanitaria', 
      'água sanitária', 'esponja', 'bucha', 'papel toalha', 'papel higienico', 
      'papel higiênico', 'pano', 'vassoura', 'rodo', 'lixo', 'saco de lixo', 
      'lustra moveis', 'limpa vidro', 'cloro', 'alcool', 'álcool', 'inseticida'
    ]
  },
  {
    id: 'higiene',
    name: 'Higiene & Cuidados',
    emoji: '🧴',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    keywords: [
      'sabonete', 'shampoo', 'xampu', 'condicionador', 'pasta de dente', 'creme dental', 
      'escova', 'desodorante', 'fio dental', 'lamina', 'lâmina', 'gilete', 'cotonete', 
      'algodao', 'algodão', 'protetor solar', 'hidratante', 'remedio', 'remédio', 
      'absorvente', 'pomada', 'curativo', 'lenço umedecido', 'fralda'
    ]
  },
  {
    id: 'congelados',
    name: 'Congelados & Sobremesas',
    emoji: '❄️',
    color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    keywords: [
      'sorvete', 'picole', 'picolé', 'lasanha congelada', 'pizza congelada', 'nugget', 
      'nuggets', 'batata congelada', 'acai', 'açaí', 'gelo', 'polpa de fruta', 'congelado'
    ]
  },
  {
    id: 'outros',
    name: 'Outros',
    emoji: '🛒',
    color: 'bg-slate-100 text-slate-800 border-slate-200',
    keywords: []
  }
];

// Função para remover acentos e caracteres especiais para busca
export function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Detecta automaticamente a categoria e emoji a partir do nome do produto digitado
export function detectCategory(itemName) {
  const normalized = normalizeText(itemName);
  if (!normalized) return CATEGORIES[CATEGORIES.length - 1]; // Outros

  // Procura match de palavras-chave
  for (const cat of CATEGORIES) {
    if (cat.id === 'outros') continue;
    for (const kw of cat.keywords) {
      const normalizedKw = normalizeText(kw);
      // Checa se a palavra-chave está contida no nome do item como palavra completa ou prefixo
      const regex = new RegExp(`(^|\\s)${normalizedKw}(\\s|$|s\\b|es\\b)`, 'i');
      if (regex.test(normalized) || normalized.includes(normalizedKw)) {
        return cat;
      }
    }
  }

  // Fallback padrão
  return CATEGORIES.find(c => c.id === 'outros') || CATEGORIES[0];
}
