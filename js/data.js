// Banco de dados inicial estático do jogo

const GameData = {
    introTexts: [
        [
            "Barra do Corda precisava de um comandante experiente.",
            "Não sei porque o comando enviou você.",
            "O quartel possui:",
            "- pouco dinheiro",
            "- viaturas no limite da fé",
            "- militares com personalidade própria (e muita opinião)",
            "- e problemas demais para uma pessoa só.",
            "Boa sorte. Você vai precisar. 🚒"
        ],
        [
            "MISSÃO: Sobreviver ao 17° BBM de Barra do Corda.",
            "DIFICULDADE: Alta.",
            "ORÇAMENTO: Baixo.",
            "EXPECTATIVA DO COMANDO: Irracionalmente alta.",
            "EXPECTATIVA REAL: Ninguém morrer na primeira semana.",
            "Boa sorte, Comandante. Ou lamento muito. Depende de como você encará isso. 🔥"
        ],
        [
            "O rádio crepitou. Era o Comando Regional:",
            "— 'Estamos te enviando para o 17° BBM.'",
            "— 'Quanto tempo tenho para me preparar?'",
            "— 'Você já devia ter chegado.'",
            "E assim começou a sua história mais honrosa (e humilhante) no corpo de bombeiros.",
            "Seja bem-vindo ao caos. 🚒💀"
        ],
        [
            "Dizem que o quartel é um reflexo do seu comandante.",
            "O 17° BBM tinha mato no pátio, goteiras no teto e uma viatura com menos condição que dignidade.",
            "Em outras palavras: estava perfeito para receber você.",
            "Boa sorte, comandante. O quartel vai precisar mais do que você."
        ]
    ],
    
    get introText() {
        return this.introTexts[Math.floor(Math.random() * this.introTexts.length)];
    },
    
    // Níveis de reputação
    reputationLevels: [
        { max: 10, title: "Quartel Desorganizado 🤡" },
        { max: 25, title: "Quartel Operacional 🧑‍🚒" },
        { max: 40, title: "Quartel Respeitado 🫡" },
        { max: 60, title: "Referência Regional 🏆" },
        { max: 100, title: "Lendas de Barra do Corda 👑" }
    ],

    // 14 perfis disponíveis — maintCost: custo diário de manutenção do militar
    // Perfis caóticos/fracos são mais baratos mas trazem mais problemas
    profiles: {
        'Dorminhoco':       { desc: 'Dorme onde pode. Tem que chamar duas vezes.',           maintCost:  8, modifiers: { success: -0.10, fail: 0.10, chaos:  0.05 } },
        'Ímã de Confusão':  { desc: 'Se algo pode dar errado, vai dar errado com ele(a).', maintCost:  8, modifiers: { success:  0.00, fail: 0.15, chaos:  0.30 } },
        'Novato':           { desc: 'Faz muita pergunta, atrapalha um pouco.',               maintCost: 10, modifiers: { success: -0.05, fail: 0.10, chaos:  0.10 } },
        'Estressado':       { desc: 'Alta adrenalina. Resolve rápido, mas impulsivamente.',  maintCost: 12, modifiers: { success:  0.05, fail: 0.10, chaos:  0.25 } },
        'Acelerado':        { desc: 'Faz tudo rápido. Quase tudo errado.',                   maintCost: 14, modifiers: { success:  0.05, fail: 0.10, chaos:  0.10 } },
        'Calmo':            { desc: 'Fica calmo até demais nas piores situações.',           maintCost: 15, modifiers: { success:  0.05, fail:-0.05, chaos: -0.10 } },
        'Gambiarreiro':     { desc: 'Resolve o improvável. Pode quebrar equipamentos.',      maintCost: 16, modifiers: { success:  0.10, fail: 0.10, chaos:  0.20 } },
        'Líder dos BC':     { desc: 'Tenta manter a ordem. Falha miseravelmente.',           maintCost: 18, modifiers: { success:  0.10, fail:-0.05, chaos:  0.00 } },
        'Sobrevivente':     { desc: 'Já viu o inferno e voltou.',                            maintCost: 18, modifiers: { success:  0.10, fail:-0.10, chaos:  0.00 } },
        'Veterano':         { desc: 'Conhece as manhas. Reduz erros gerais.',                maintCost: 20, modifiers: { success:  0.10, fail:-0.10, chaos: -0.05 } },
        'Metódico':         { desc: 'Segue o protocolo à risca. Lento, mas certeiro.',       maintCost: 20, modifiers: { success:  0.05, fail:-0.10, chaos: -0.15 } },
        'Pé Quente':        { desc: 'Incrivelmente sortudo.',                                maintCost: 22, modifiers: { success:  0.20, fail:-0.10, chaos:  0.00 } },
        'Técnico':          { desc: 'Domina os equipamentos. Minimiza falhas técnicas.',     maintCost: 25, modifiers: { success:  0.15, fail:-0.15, chaos: -0.20 } },
        'Lenda do Quartel': { desc: 'Uma lenda viva. Melhora a reputação só de respirar.',  maintCost: 30, modifiers: { success:  0.20, fail:-0.10, chaos: -0.10 } },
    },

    characters: [
        // ── BCs ────────────────────────────────────────────────────────────────────
        { id: 'c1',  name: 'BC Ribamar',      profile: 'Gambiarreiro',    desc: 'Sempre tem uma fita isolante no bolso.',                               frase: 'Se funcionar, não mexe.' },
        { id: 'c2',  name: 'BC Carvalho',     profile: 'Novato',          desc: 'Ainda acha que ser bombeiro é igual filme americano.',                 frase: 'Onde liga a sirene?' },
        { id: 'c3',  name: 'BC Laide',        profile: 'Líder dos BC',    desc: 'Grita muito, resolve pouco.',                                          frase: 'Ninguém sai sem checklist.' },
        { id: 'c4',  name: 'BC Luh',          profile: 'Ímã de Confusão', desc: 'Perdeu um rádio na primeira semana.',                                  frase: 'Isso provavelmente vai dar errado.' },
        { id: 'c5',  name: 'BC Reis',         profile: 'Calmo',           desc: 'Fala baixo até no meio do fogo.',                                      frase: 'Sem desespero.' },
        { id: 'c6',  name: 'BC Nego Sousa',   profile: 'Acelerado',       desc: 'Está no local antes mesmo do rádio terminar a chamada.',               frase: 'Já tô indo!' },
        { id: 'c7',  name: 'BC Thayrana',     profile: 'Metódico',        desc: 'Confere o equipamento três vezes antes de sair. Duas vezes depois.',   frase: 'Vamos pelo protocolo.' },
        // ── SGTs / SUBs ─────────────────────────────────────────────────────────────
        { id: 'c8',  name: 'SGT Acioly',      profile: 'Dorminhoco',      desc: 'Paciência de monge budista — principalmente porque está dormindo.',     frase: 'Cinco minutinhos...' },
        { id: 'c9',  name: 'SGT Rabelo',      profile: 'Estressado',      desc: 'Corre primeiro, grita depois, pensa quando der.',                      frase: 'Já tô indo!' },
        { id: 'c12', name: 'SGT Eduardo',     profile: 'Lenda do Quartel',desc: 'As chamas apagam sozinhas por respeito.',                              frase: 'No meu tempo era pior.' },
        { id: 'c13', name: 'SGT Vieira',      profile: 'Dorminhoco',      desc: 'Leva 10 minutos para calçar o coturno. Chega sempre no final do caos, bem descansado.', frase: 'Calma... já vou.' },
        { id: 'c14', name: 'SUB Guilhom',     profile: 'Veterano',        desc: 'Sabe mais que o manual técnico.',                                      frase: 'Já vi de tudo.' },
        // ── TENs ────────────────────────────────────────────────────────────────────
        { id: 'c10', name: 'TEN Vasconcelos', profile: 'Pé Quente',       desc: 'Sempre escapa das escalas ruins.',                                     frase: 'Hoje dá bom.' },
        { id: 'c11', name: 'TEN Thayane',     profile: 'Sobrevivente',    desc: 'A viatura capotou 3 vezes, ela saiu ilesa.',                           frase: 'Já passei por pior.' },
        { id: 'c15', name: 'TEN Aquino',      profile: 'Lenda do Quartel',desc: 'Resolve a ocorrência só de olhar feio para ela. Supostamente.',        frase: 'O problema já foi resolvido.' },
        { id: 'c16', name: 'TEN Carmo Sousa', profile: 'Calmo',           desc: 'Nunca aumenta a voz.',                                                 frase: 'Respira primeiro.' },
        { id: 'c17', name: 'TEN Cassio Murilo',profile: 'Veterano',        desc: 'Duas décadas de serviço. Já fez de tudo. Já viu de tudo. Já resolveu de tudo.', frase: 'Deixa que eu cuido.' },
        { id: 'c18', name: 'TEN Sobrinho',    profile: 'Metódico',        desc: 'Segue o manual à risca, nem que a ocorrência já tenha acabado.',      frase: 'Está documentado no protocolo?' },
        { id: 'c19', name: 'TEN Kelvin',      profile: 'Técnico',         desc: 'Conhece cada especificação técnica dos equipamentos de cor.',          frase: 'Está dentro do protocolo.' },
        { id: 'c20', name: 'TEN Sandy',       profile: 'Técnico',         desc: 'Conhece cada equipamento técnico e cobra que todos conheçam também.', frase: 'Vamos verificar os parâmetros.' },
        { id: 'c21', name: 'TEN Roberto',     profile: 'Acelerado',       desc: 'Sai da viatura antes dela parar. Nem sempre termina bem.',            frase: 'Já tô resolvendo!' },
        // ── Adicionados ─────────────────────────────────────────────────────────────
        { id: 'c22', name: 'SGT Dayvith',     profile: 'Metódico',        desc: 'Faz a checklist da checklist antes de sair. Nunca faltou nenhum equipamento.', frase: 'Confirmado. Vamos.' },
        { id: 'c23', name: 'BC Leandro',      profile: 'Calmo',           desc: 'Mesmo nas piores ocorrências, parece que está numa tarde de domingo.', frase: 'Tranquilo.' },
    ],

    vehicles: [
        { id: 'v1', name: 'ABTF-01', desc: 'Vaza água. Mas apaga fogo.', condition: 100, fuel: 100, baseFailChance: 0.1, type: 'Caminhão' },
        { id: 'v2', name: 'USA-01', desc: 'A ambulância que mais quebra na BR.', condition: 100, fuel: 100, baseFailChance: 0.15, type: 'Resgate' },
        { id: 'v3', name: 'ADM-01', desc: 'Ar condicionado gelando.', condition: 100, fuel: 100, baseFailChance: 0.05, type: 'Administrativo' },
        { id: 'v4', name: 'Caminhonete Operacional', desc: 'Pula mais que cavalo brabo.', condition: 100, fuel: 100, baseFailChance: 0.1, type: 'Apoio' },
        { id: 'v5', name: 'Moto do Militar', desc: 'Chega rápido, se não furar o pneu.', condition: 100, fuel: 100, baseFailChance: 0.2, type: 'Apoio' },
        { id: 'v6', name: 'Caminhão Velho da Prefeitura', desc: 'Ele ainda funciona. Supostamente.', condition: 50, fuel: 100, baseFailChance: 0.4, type: 'Caminhão' },
        { id: 'v7', name: 'Lancha de Resgate', desc: 'Fica parada 90% do tempo.', condition: 100, fuel: 100, baseFailChance: 0.1, type: 'Aquático' },
        { id: 'v8', name: 'Carretinha de Equipamentos', desc: 'Um dia a roda vai soltar.', condition: 80, fuel: 0, baseFailChance: 0.3, type: 'Reboque' }
    ],

    locations: [
        'Centro', 'Trizidela', 'Altamira', 'Tamarindo', 'Vila Alvorada', 'BR-226', 'Rio Corda', 'Zona Rural'
    ],

    occurrences: [
        { type: 'captura de cobra', baseDifficulty: 2, risk: 1, reward: 100, tags: ['animal'], minMilitares: 1, minViaturas: 1 },
        { type: 'incêndio residencial', baseDifficulty: 5, risk: 4, reward: 500, tags: ['fogo', 'urbano'], minMilitares: 2, minViaturas: 1 },
        { type: 'fogo em vegetação', baseDifficulty: 3, risk: 2, reward: 200, tags: ['fogo', 'rural'], minMilitares: 2, minViaturas: 1 },
        { type: 'acidente na BR-226', baseDifficulty: 6, risk: 5, reward: 600, tags: ['resgate', 'estrada'], minMilitares: 2, minViaturas: 2 },
        { type: 'enchente', baseDifficulty: 7, risk: 6, reward: 700, tags: ['aquático', 'clima'], minMilitares: 2, minViaturas: 1 },
        { type: 'gato em árvore', baseDifficulty: 1, risk: 1, reward: 50, tags: ['animal', 'urbano'], minMilitares: 1, minViaturas: 1 },
        { type: 'curto-circuito', baseDifficulty: 4, risk: 4, reward: 350, tags: ['fogo', 'urbano'], minMilitares: 1, minViaturas: 1 },
        { type: 'afogamento', baseDifficulty: 8, risk: 7, reward: 800, tags: ['aquático', 'resgate'], minMilitares: 2, minViaturas: 1 },
        { type: 'busca em mata', baseDifficulty: 6, risk: 4, reward: 500, tags: ['resgate', 'rural'], minMilitares: 2, minViaturas: 1 },
        { type: 'múltiplas vítimas', baseDifficulty: 9, risk: 8, reward: 1000, tags: ['resgate', 'caos'], minMilitares: 3, minViaturas: 2 },
        { type: 'incêndio em motocicleta', baseDifficulty: 3, risk: 3, reward: 250, tags: ['fogo', 'rua'], minMilitares: 1, minViaturas: 1 },
        { type: 'veículo atolado', baseDifficulty: 2, risk: 2, reward: 150, tags: ['resgate', 'rural'], minMilitares: 1, minViaturas: 1 },
        { type: 'retirada de anel', baseDifficulty: 1, risk: 1, reward: 50, tags: ['apoio', 'urbano'], minMilitares: 1, minViaturas: 1 },
        { type: 'fogo em terreno baldio', baseDifficulty: 2, risk: 1, reward: 150, tags: ['fogo', 'urbano'], minMilitares: 1, minViaturas: 1 }
    ],

    // Eventos genéricos (sem militar específico)
    events: [
        { text: 'Vídeo de um resgate viralizou no TikTok! O comando estadual mandou parabéns.', repChange: 5, moneyChange: 0 },
        { text: 'Pane elétrica no quartel. Tiveram que fazer uma vaquinha para comprar disjuntor.', repChange: 0, moneyChange: -50 },
        { text: 'Chuva forte na cidade. As goteiras no telhado do quartel viraram cachoeiras.', repChange: -1, moneyChange: 0 },
        { text: 'Um cachorro de rua invadiu o quartel e adotou a guarnição.', repChange: 2, moneyChange: -20 },
        { text: 'Prefeito doou galões de combustível. Pelo menos isso.', repChange: 0, moneyChange: 300 },
        { text: 'O ar condicionado do alojamento quebrou. A produtividade afundou junto.', repChange: -1, moneyChange: -80 },
        { text: 'Matéria elogiosa saiu no jornal local. "Heróis de Barra do Corda!" Será.', repChange: 4, moneyChange: 0 },
        { text: 'A viatura foi usada como cenário de foto para casamento. O noivo pagou bem.', repChange: 1, moneyChange: 200 },
        { text: 'Treino físico motivacional virou briga coletiva. Moral foi à lona.', repChange: -2, moneyChange: 0 },
        { text: 'Doação anônima de salgados e refrigerante. A tropa nunca esteve tão unida.', repChange: 2, moneyChange: 50 },
        { text: 'Vazamento na caixa d\'água inundou o banheiro. Ninguém sabe quem é o responsável.', repChange: -1, moneyChange: -120 }
    ],

    // Eventos que usam nome de um militar aleatório da tropa (placeholder {soldier})
    troopEvents: [
        { text: '{soldier} tentou fazer uma gambiarra na cafeteira e fechou curto no quartel inteiro.', repChange: -1, moneyChange: -50 },
        { text: '{soldier} esqueceu o coturno no banheiro. A viatura saiu sem ele/ela. Foi buscar de chinelo.', repChange: -2, moneyChange: 0 },
        { text: '{soldier} dormiu na guarita e o rádio tocou durante 20 minutos sem resposta.', repChange: -2, moneyChange: 0 },
        { text: '{soldier} preparou um café que ninguém ousou beber. Foi jogado fora discretamente.', repChange: -1, moneyChange: -10 },
        { text: '{soldier} disse que sabia consertar o equipamento. Agora há mais peças no chão do que na máquina.', repChange: 0, moneyChange: -150 },
        { text: '{soldier} salvou um cachorro preso numa vala. Foto viralizou com 800 curtidas.', repChange: 3, moneyChange: 0 },
        { text: '{soldier} discutiu com o Zé da oficina e agora a viatura vai demorar o dobro para ser consertada.', repChange: -1, moneyChange: -80 },
        { text: '{soldier} foi elogiado pelo prefeito pessoalmente. Ninguém entendeu por quê.', repChange: 4, moneyChange: 0 },
        { text: '{soldier} ligou a sirene por engano durante a hora do alço. O quartel entrou em pânico.', repChange: -2, moneyChange: 0 },
        { text: '{soldier} encontrou R$ 200 na viatura. Ninguém sabe de quem era. Ficou no caixa do quartel.', repChange: 1, moneyChange: 200 },
        { text: '{soldier} apareceu com uma “receita segura de gambiarra” para a mangueira. Funcionou. Desta vez.', repChange: 2, moneyChange: -20 },
        { text: 'Câmera de segurança flagrou {soldier} dormindo em serviço. Viralizou localmente.', repChange: -3, moneyChange: 0 },
        { text: '{soldier} esqueceu o rádio ligado na freqüência errada por 4 horas. Ninguém percebeu.', repChange: -1, moneyChange: 0 },
        { text: '{soldier} organizou o almoxárifado sem ninguém pedir. A tropa ficou desconfiada.', repChange: 2, moneyChange: 30 },
        { text: 'Sirene tocou sozinha às 3 da manhã. {soldier} jurou que não encostou em nada.', repChange: -1, moneyChange: 0 },
        { text: '{soldier} treinou os recrutas do bairro em primeiros socorros. A comunidade adorou.', repChange: 3, moneyChange: 0 },
        { text: '{soldier} consertou o portão do quartel que emperrava há meses. Pequena vitória, moral alta.', repChange: 1, moneyChange: 0 },
        { text: '{soldier} conseguiu doação de equipamentos de uma empresa local. Inesperado, mas bem-vindo.', repChange: 2, moneyChange: 150 },
        { text: '{soldier} foi entrevistado na rádio local e falou bem do quartel. Reputação nas alturas por um dia.', repChange: 4, moneyChange: 0 },
        { text: '{soldier} organizou um churrasco para a tropa com dinheiro do próprio bolso. Moral renovada.', repChange: 2, moneyChange: 50 }
    ],

    // Sinergias secretas militar+viatura
    synergies: [
        {
            profileKey: 'Gambiarreiro',
            vehicleId: 'v6', // Caminhão Velho da Prefeitura
            successBonus: 0.25,
            chaosReduction: 0.15,
            desc: '✨ SINERGIA: Gambiarreiro no Caminhão Velho! Ele já tá acostumado com tralha. Bonus de +25% sucesso!'
        },
        {
            profileKey: 'Calmo',
            vehicleId: 'v5', // Moto
            successBonus: 0.2,
            chaosReduction: 0.2,
            desc: '✨ SINERGIA: Calmo na Moto. Não acelera sem pensar. Chegas com vitória e sem capotamento.'
        },
        {
            profileKey: 'Acelerado',
            vehicleId: 'v4', // Caminhonete
            successBonus: 0.15,
            chaosReduction: -0.1,
            desc: '⚡ SINERGIA PERIGOSA: Acelerado na Caminhonete. Chega rápido... mas como?‼️'
        },
        {
            profileKey: 'Sobrevivente',
            vehicleId: 'v2', // USA-01
            successBonus: 0.2,
            chaosReduction: 0.1,
            desc: '✨ SINERGIA: Sobrevivente na Ambulância. Já capotou nessa 3 vezes. Sabe cada parafuso dela.'
        },
        {
            profileKey: 'Novato',
            vehicleId: 'v3', // ADM-01
            successBonus: 0.1,
            chaosReduction: 0.1,
            desc: '✨ SINERGIA: Novato no ADM-01. Nem ele nem o carro fazem nada importante. Combinam perfeitamente.'
        }
    ],

    // Oficina do Zé — resultados de conserto
    workshopOutcomes: [
        { type: 'success', repairAmount: 40, text: 'O Zé fez um trabalho decente! A viatura voltou em ótimo estado. Desta vez.', cost: 300 },
        { type: 'success', repairAmount: 25, text: 'Conserto ok. Não foi perfeito, mas pelo menos a viatura parou de tremer.', cost: 300 },
        { type: 'fail', repairAmount: -15, text: 'O Zé disse que consertou. A viatura voltou pior. E ele some com o dinheiro.', cost: 300 },
        { type: 'fail', repairAmount: -10, text: 'Uma peça "nova" foi instalada. Parece que era de outro carro. A situação piorou.', cost: 300 },
        { type: 'chaos', repairAmount: 50, text: 'O Zé usou um método não convencional mas FUNCIONOU. Viatura 50% restaurada! Milagre!', cost: 300 },
        { type: 'chaos', repairAmount: -30, text: 'A viatura entrou na oficina com problema. Saiu com dois. E o Zé cobrou hora extra.', cost: 300 }
    ],

    // Evento especial do TC Matos — disparado pela engine em dia aleatório
    tcMatosEvent: {
        text: '🎖️ VISITA SURPRESA DO TC MATOS! O inspetor entrou no quartel sem avisar. Papéis espalhados, militares correndo, café derramado. Resultado: ele achou que estava num quartel "com vida". Reputação salvaguardada... por enquanto.',
        repChange: 3,
        moneyChange: -50,
        moralChange: -3,
        logMsg: '[TC MATOS] Visita de inspeção. O quartel foi varrido em tempo recorde. Algumas irregularidades foram... escondidas estrategicamente.'
    },

    difficulties: {
        facil:   { label: 'FÁCIL',   successBonus:  0.10, startMoney: 1500, penaltyMult: 0.7  },
        normal:  { label: 'NORMAL',  successBonus:  0.00, startMoney: 1000, penaltyMult: 1.0  },
        dificil: { label: 'DIFÍCIL', successBonus: -0.10, startMoney:  700, penaltyMult: 1.3  },
    },

    weeklyGoals: [
        { id: 'fire3',    text: 'Atender 3 ocorrências de fogo',           tag: 'fogo',    count: 3, repReward: 5, moneyReward: 300 },
        { id: 'rescue2',  text: 'Realizar 2 resgates',                     tag: 'resgate', count: 2, repReward: 4, moneyReward: 200 },
        { id: 'animal3',  text: 'Atender 3 chamados de animal',            tag: 'animal',  count: 3, repReward: 3, moneyReward: 150 },
        { id: 'missions5',text: 'Atender 5 chamados em 7 dias',            tag: 'any',     count: 5, repReward: 4, moneyReward: 250 },
        { id: 'noFail3',  text: 'Completar 3 ocorrências seguidas sem falhar', tag: 'noFail', count: 3, repReward: 6, moneyReward: 400 },
    ],

    militaryMilestones: [
        { missions:  3, tag: 'Veterano de Rua', successBonus: 0    },
        { missions:  8, tag: 'Curtido',         successBonus: 0.05 },
        { missions: 15, tag: 'Lenda Viva',      successBonus: 0.10 },
    ],

    narrativeSnippets: {
        success: [
            "{character} resolveu a ocorrência sozinho(a). Supostamente.",
            "O problema foi resolvido de alguma forma. A viatura {vehicle} ajudou. Ou não.",
            "{character} fez uma gambiarra que funcionou incrivelmente bem.",
            "Tudo sob controle. O fogo apagou por respeito a {character}.",
            "{character} chegou na {location} e dominou a situação antes mesmo de descer da viatura.",
            "A {vehicle} chegou em {location} sem furar o pneu nem uma vez. Recorde pessoal.",
            "{character} usou a estratégia certa. O quartel ganhou mais um epísódio de glória."
        ],
        fail: [
            "{character} tentou ajudar, mas só piorou tudo.",
            "A viatura {vehicle} quebrou no meio do caminho para {location}.",
            "Chegaram tarde demais. O estrago já estava feito. Culpa de {character}?",
            "Um completo desastre tático. Até a população estava constrangida.",
            "A mangueira furou, o rádio pifou, e {character} tropeou no próprio pé.",
            "A {vehicle} ficou atolada a dois quarteiroes da ocorrência em {location}. À pé era mais rápido."
        ],
        chaos: [
            "{character} improvisou uma extensão usando materiais que definitivamente não deveriam ser usados nisso. Supostamente era seguro.",
            "A viatura {vehicle} disparou a sirene sozinha e não quis desligar.",
            "No meio do caos em {location}, {character} encontrou um cachorro de rua e adotou.",
            "Uma viatura da PM parou para ver {character} gritando com uma mangueira enrolada.",
            "A população aplaudiu quando {character} fez algo muito estúpido que tecnicamente deu certo.",
            "{character} ligou para o quartel pedindo instruções. O rádio estava desligado. Ele não sabia."
        ]
    }
};
