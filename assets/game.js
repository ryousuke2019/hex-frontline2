const SIZE = 15;
    const BASE_CANVAS_W = 820;
    const BASE_CANVAS_H = 670;
    let BASE_HEX_SIZE = 28;
    let HEX_SIZE = 28;
    let HEX_W = Math.sqrt(3) * HEX_SIZE;
    let HEX_H = 2 * HEX_SIZE;
    let BASE_HEX_W = Math.sqrt(3) * BASE_HEX_SIZE;
    let BASE_HEX_H = 2 * BASE_HEX_SIZE;
    let mapOffsetX = 44;
    let mapOffsetY = 36;
    let MAP_OFFSET_X = 44;
    let MAP_OFFSET_Y = 36;
    let canvasCssWidth = BASE_CANVAS_W;
    let canvasCssHeight = BASE_CANVAS_H;
    let zoomScale = 1;
    let lastCanvasSize = "";
    let pointerState = null;
    let pinchState = null;
    const activePointers = new Map();
    const MIN_ZOOM_PC = 0.6;
    const MAX_ZOOM_PC = 2.2;
    const MIN_ZOOM_TOUCH = 0.7;
    const MAX_ZOOM_TOUCH = 2.5;
    const MAX_UNIT_COUNT = 10;
    const FACILITY_REPAIR_AMOUNT = 2;
    const FACTORY_REPAIR_AMOUNT = 3;
    const SAVE_KEY = "frontline-hex-15-save-v1";
    const AI_RESULTS_KEY = "frontline-hex-ai-validation-v1";
    const AI_SETTINGS_KEY = "frontline-hex-ai-settings-v1";
    const AI_MAX_TURNS = 60;
    const aiProfiles = {
      balanced: {
        name: "バランス型", neutralCityWeight: 300, enemyCityWeight: 350, factoryWeight: 500,
        enemyHqWeight: 800, defenseWeight: 700, repairWeight: 500,
        tankProductionWeight: 300, infantryProductionWeight: 250, helicopterProductionWeight: 220,
        artilleryProductionWeight: 200, antiAirProductionWeight: 180,
        aggression: 1, economyFocus: 1, defenseFocus: 1
      },
      economy: {
        name: "経済重視型", neutralCityWeight: 450, enemyCityWeight: 300, factoryWeight: 650,
        enemyHqWeight: 600, defenseWeight: 700, repairWeight: 550,
        tankProductionWeight: 260, infantryProductionWeight: 320, helicopterProductionWeight: 180,
        artilleryProductionWeight: 180, antiAirProductionWeight: 150,
        aggression: .8, economyFocus: 1.4, defenseFocus: 1
      },
      aggressive: {
        name: "攻撃重視型", neutralCityWeight: 250, enemyCityWeight: 400, factoryWeight: 450,
        enemyHqWeight: 1100, defenseWeight: 500, repairWeight: 350,
        tankProductionWeight: 360, infantryProductionWeight: 220, helicopterProductionWeight: 300,
        artilleryProductionWeight: 250, antiAirProductionWeight: 160,
        aggression: 1.4, economyFocus: .8, defenseFocus: .8
      },
      defensive: {
        name: "防衛重視型", neutralCityWeight: 320, enemyCityWeight: 250, factoryWeight: 520,
        enemyHqWeight: 600, defenseWeight: 1000, repairWeight: 700,
        tankProductionWeight: 280, infantryProductionWeight: 280, helicopterProductionWeight: 150,
        artilleryProductionWeight: 260, antiAirProductionWeight: 250,
        aggression: .7, economyFocus: 1, defenseFocus: 1.5
      },
      airMobile: {
        name: "ヘリ重視型", neutralCityWeight: 300, enemyCityWeight: 330, factoryWeight: 500,
        enemyHqWeight: 850, defenseWeight: 650, repairWeight: 450,
        tankProductionWeight: 240, infantryProductionWeight: 230, helicopterProductionWeight: 500,
        artilleryProductionWeight: 180, antiAirProductionWeight: 220,
        aggression: 1.1, economyFocus: .9, defenseFocus: .9
      }
    };
    const terrainDefs = {
      plain: { name: "平地", move: 1, defense: 0, icon: "", passable: true },
      forest: { name: "森", move: 2, defense: 10, icon: "", passable: true },
      city: { name: "都市", move: 1, defense: 20, icon: "都", passable: true, repair: { count: FACILITY_REPAIR_AMOUNT } },
      factory: { name: "工場", move: 1, defense: 15, icon: "工", passable: true, repair: { count: FACTORY_REPAIR_AMOUNT } },
      hq: { name: "司令部", move: 1, defense: 25, icon: "旗", passable: true, repair: { count: FACILITY_REPAIR_AMOUNT } },
      mountain: { name: "山", move: Infinity, defense: 30, icon: "山", passable: false },
      river: { name: "川", move: Infinity, defense: 0, icon: "", passable: false },
      bridge: { name: "橋", move: 1, defense: 0, icon: "橋", passable: true }
    };

    const unitDefs = {
      infantry: { name: "歩兵", short: "歩", hp: 80, move: 3, attack: 15, defense: 5, range: 1, sight: 2, cost: 100, vehicle: false, movementType: "ground", targetTypes: ["ground"] },
      tank: { name: "戦車", short: "戦", hp: 100, move: 4, attack: 35, defense: 20, range: 1, sight: 3, cost: 300, vehicle: true, movementType: "ground", targetTypes: ["ground"] },
      heavyTank: { name: "重戦車", short: "重", hp: 140, move: 3, attack: 50, defense: 35, range: 1, sight: 3, cost: 600, vehicle: true, heavy: true, movementType: "ground", targetTypes: ["ground"] },
      artillery: { name: "自走砲", short: "砲", hp: 75, move: 3, attack: 40, defense: 10, range: 3, minRange: 2, sight: 4, cost: 400, vehicle: true, longRange: true, movementType: "ground", targetTypes: ["ground"] },
      attackHeli: { name: "攻撃ヘリ", short: "ヘ", hp: 90, move: 6, attack: 32, defense: 13, range: 1, sight: 4, cost: 490, vehicle: false, movementType: "air", targetTypes: ["ground", "air"] },
      antiAir: { name: "対空車両", short: "対", hp: 90, move: 4, attack: 0, airAttack: 52, defense: 15, range: 4, minRange: 2, sight: 4, cost: 355, vehicle: true, longRange: true, movementType: "ground", targetTypes: ["air"] }
    };
    const factionUnitStats = {
      blue: {
        infantry: { name: "西側歩兵", short: "西歩", attack: 16, defense: 5, move: 3, range: 1, sight: 2, cost: 110 },
        tank: { name: "西側戦車", short: "西戦", attack: 38, defense: 22, move: 4, range: 1, sight: 3, cost: 330 },
        heavyTank: { name: "レオパルド2", short: "レオパ2", attack: 55, defense: 38, move: 4, range: 1, sight: 3, cost: 660 },
        artillery: { name: "西側自走砲", short: "西砲", attack: 42, defense: 12, move: 3, range: 3, minRange: 2, sight: 3, cost: 440 },
        attackHeli: { name: "西側攻撃ヘリ", short: "西ヘ", attack: 40, defense: 14, move: 6, range: 1, sight: 4, cost: 520 },
        antiAir: { name: "西側対空車両", short: "西対", attack: 0, airAttack: 55, defense: 16, move: 4, range: 4, minRange: 2, sight: 4, cost: 380 }
      },
      red: {
        infantry: { name: "東側歩兵", short: "東歩", attack: 15, defense: 4, move: 3, range: 1, sight: 2, cost: 90 },
        tank: { name: "東側戦車", short: "東戦", attack: 35, defense: 20, move: 4, range: 1, sight: 3, cost: 280 },
        heavyTank: { name: "東側重戦車", short: "東重", attack: 50, defense: 35, move: 3, range: 1, sight: 3, cost: 570 },
        artillery: { name: "東側自走砲", short: "東砲", attack: 39, defense: 10, move: 3, range: 3, minRange: 2, sight: 3, cost: 380 },
        attackHeli: { name: "東側攻撃ヘリ", short: "東ヘ", attack: 37, defense: 12, move: 6, range: 1, sight: 4, cost: 460 },
        antiAir: { name: "東側対空車両", short: "東対", attack: 0, airAttack: 50, defense: 14, move: 4, range: 4, minRange: 2, sight: 4, cost: 330 }
      }
    };
    const producibleTypes = ["infantry", "tank", "heavyTank", "artillery", "attackHeli", "antiAir"];
    const teamName = { blue: "青軍", red: "赤軍", neutral: "中立" };
    const DEFAULT_SCENARIO_ID = "borderBridge";
    const scenarioDefs = {
      borderBridge: {
        mapId: "borderRiver",
        mapName: "国境河川マップ",
        name: "国境の橋",
        difficulty: "初心者向け",
        description: "中央の川に架かる3本の橋を巡る基本シナリオ。橋頭堡を確保して敵司令部へ進軍します。",
        forests: [
          [5,0],[6,0],[5,1],[6,1],[1,2],[5,2],[6,2],[13,2],[1,3],[13,3],[1,4],[2,4],[12,4],[13,4],
          [0,6],[14,6],[0,8],[14,8],[1,10],[2,10],[12,10],[13,10],[1,11],[13,11],[10,12],[11,12],[10,13],[11,13],[3,12],[4,12],[3,13],[11,2],[12,2]
        ],
        mountains: [[8,0],[8,1],[8,2],[9,2],[10,2],[3,4],[3,5],[4,4],[10,4],[11,4],[10,5],[11,5],[0,7],[14,7],[4,9],[5,9],[4,10],[8,10],[9,10],[8,11],[5,12],[6,12],[7,12],[8,12],[6,13],[6,14]],
        riverPath: Array.from({ length: 15 }, (_, x) => [x, 7]),
        bridges: [[3,7],[7,7],[11,7]],
        facilities: [
          [0,0,"hq","blue"],[2,2,"city","blue"],[1,4,"factory","blue"],[4,5,"city","blue"],
          [3,2,"city","neutral"],[2,12,"city","neutral"],[11,2,"city","neutral"],[11,12,"city","neutral"],
          [2,6,"city","neutral"],[5,6,"city","neutral"],[7,5,"factory","neutral"],[8,8,"factory","neutral"],[10,8,"city","neutral"],[12,8,"city","neutral"],[6,10,"city","neutral"],
          [10,11,"city","red"],[12,12,"city","red"],[13,10,"factory","red"],[14,14,"hq","red"]
        ],
        units: [
          ["blue","infantry",1,0],["blue","tank",0,2],["blue","artillery",2,1],["blue","infantry",4,6],["blue","tank",1,4],["blue","heavyTank",2,3],["blue","attackHeli",3,1],["blue","antiAir",3,3],
          ["red","infantry",13,14],["red","tank",13,13],["red","artillery",12,13],["red","infantry",11,11],["red","tank",13,10],["red","heavyTank",12,11],["red","attackHeli",11,13],["red","antiAir",11,10]
        ]
      },
      mountainFortress: {
        mapId: "borderRiver",
        mapName: "国境河川マップ",
        name: "山岳要塞",
        difficulty: "中級者向け",
        description: "山脈が戦場を分断し、渡河地点も2か所だけ。限られた進軍路と砲兵の配置が勝敗を分けます。",
        forests: [[4,0],[5,0],[9,0],[10,0],[4,1],[10,1],[1,3],[5,3],[9,3],[13,3],[1,5],[5,5],[9,5],[13,5],[1,9],[5,9],[9,9],[13,9],[1,11],[5,11],[9,11],[13,11],[4,14],[5,14],[9,14],[10,14]],
        mountains: [
          [6,0],[7,0],[8,0],[6,1],[8,1],[6,2],[7,2],[8,2],[3,3],[4,3],[10,3],[11,3],[3,4],[4,4],[6,4],[7,4],[8,4],[10,4],[11,4],
          [3,5],[6,5],[8,5],[11,5],[3,6],[4,6],[6,6],[8,6],[10,6],[11,6],[0,7],[1,7],[4,7],[5,7],[6,7],[7,7],[8,7],[9,7],[10,7],[13,7],[14,7],
          [3,8],[4,8],[6,8],[8,8],[10,8],[11,8],[3,9],[6,9],[7,9],[8,9],[11,9],[3,10],[4,10],[6,10],[8,10],[10,10],[11,10],
          [3,11],[4,11],[10,11],[11,11],[6,12],[7,12],[8,12],[6,13],[8,13],[6,14],[7,14],[8,14]
        ],
        riverPath: Array.from({ length: 15 }, (_, x) => [x, 7]),
        bridges: [[2,7],[12,7]],
        facilities: [
          [0,0,"hq","blue"],[2,2,"city","blue"],[1,4,"factory","blue"],[2,5,"city","blue"],
          [2,6,"city","neutral"],[12,6,"city","neutral"],[5,4,"city","neutral"],[9,5,"factory","neutral"],[5,10,"factory","neutral"],[9,10,"city","neutral"],[2,8,"city","neutral"],[12,8,"city","neutral"],
          [12,9,"city","red"],[12,12,"city","red"],[13,10,"factory","red"],[14,14,"hq","red"]
        ],
        units: [
          ["blue","infantry",1,0],["blue","tank",2,1],["blue","artillery",1,2],["blue","infantry",2,4],["blue","heavyTank",5,2],["blue","attackHeli",4,1],["blue","antiAir",5,1],
          ["red","infantry",13,14],["red","tank",12,13],["red","artillery",13,12],["red","infantry",12,10],["red","heavyTank",9,12],["red","attackHeli",10,13],["red","antiAir",9,13]
        ]
      },
      urbanContest: {
        mapId: "borderRiver",
        mapName: "国境河川マップ",
        name: "都市争奪戦",
        difficulty: "占領・生産重視",
        description: "多数の中立都市と工場が点在する資金戦。歩兵を展開し、生産拠点を早く確保することが重要です。",
        forests: [[5,0],[9,0],[4,2],[10,2],[1,5],[13,5],[5,5],[9,5],[0,9],[14,9],[4,10],[10,10],[2,13],[12,13]],
        mountains: [[7,0],[7,1],[3,3],[11,3],[6,4],[8,4],[0,7],[14,7],[5,9],[9,9],[3,11],[11,11],[7,13],[7,14]],
        riverPath: Array.from({ length: 15 }, (_, x) => [x, 7]),
        bridges: [[4,7],[7,7],[10,7]],
        facilities: [
          [0,0,"hq","blue"],[2,1,"city","blue"],[1,3,"factory","blue"],[3,5,"city","blue"],
          [3,1,"city","neutral"],[6,2,"factory","neutral"],[9,2,"city","neutral"],[12,2,"city","neutral"],[2,5,"city","neutral"],[5,6,"city","neutral"],[7,5,"factory","neutral"],[9,6,"city","neutral"],[12,5,"factory","neutral"],
          [2,9,"city","neutral"],[5,8,"factory","neutral"],[7,9,"city","neutral"],[9,8,"factory","neutral"],[12,9,"city","neutral"],[2,12,"city","neutral"],[5,12,"city","neutral"],[8,12,"factory","neutral"],[11,13,"city","neutral"],
          [11,9,"city","red"],[13,11,"factory","red"],[12,13,"city","red"],[14,14,"hq","red"]
        ],
        units: [
          ["blue","infantry",1,0],["blue","infantry",3,2],["blue","infantry",2,4],["blue","tank",0,2],["blue","artillery",4,1],["blue","attackHeli",5,1],["blue","antiAir",4,3],
          ["red","infantry",13,14],["red","infantry",11,12],["red","infantry",12,10],["red","tank",14,12],["red","artillery",10,13],["red","attackHeli",9,13],["red","antiAir",10,11]
        ]
      },
      mountainLakeside: {
        mapId: "mountainLakeside",
        mapName: "山岳湖畔マップ",
        name: "山岳湖畔",
        difficulty: "中上級者向け",
        description: "大河のない山岳湖沼地帯。北・中央・南の狭い湖畔ルートと中立都市を巡り、航空戦力も活用します。",
        forests: [[2,1],[3,1],[11,1],[12,1],[1,4],[4,4],[10,4],[13,4],[1,7],[4,7],[12,7],[13,7],[1,11],[3,11],[11,11],[13,11],[2,13],[3,13],[11,13],[12,13]],
        mountains: [
          [5,0],[6,0],[8,0],[9,0],[5,1],[9,1],[5,2],[6,2],[8,2],[9,2],
          [3,3],[4,3],[6,3],[8,3],[10,3],[11,3],[3,4],[6,4],[8,4],[11,4],
          [3,5],[4,5],[10,5],[11,5],[3,6],[11,6],[5,7],[9,7],
          [3,8],[4,8],[8,8],[12,8],[3,9],[8,9],[12,9],[3,10],[8,10],[9,10],[12,10],
          [4,11],[5,11],[9,11],[10,11],[4,12],[6,12],[8,12],[10,12],[5,13],[9,13],[5,14],[6,14],[8,14],[9,14]
        ],
        riverPath: [[6,5],[7,5],[8,5],[6,6],[7,6],[8,6],[5,9],[6,9],[5,10],[6,10],[10,8],[11,8],[10,9],[11,9]],
        bridges: [],
        corridors: [
          [4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],
          [4,3],[5,3],[5,4],[5,5],[5,6],[6,7],[7,7],[8,7],[9,7],[10,7],[11,7],
          [4,11],[5,11],[6,11],[7,11],[8,11],[9,11],[10,11],[11,11]
        ],
        facilities: [
          [0,0,"hq","blue"],[2,2,"city","blue"],[1,5,"factory","blue"],[3,6,"city","blue"],
          [4,2,"city","neutral"],[7,2,"city","neutral"],[10,2,"city","neutral"],[2,7,"city","neutral"],[7,7,"factory","neutral"],[12,7,"city","neutral"],
          [2,10,"city","neutral"],[7,10,"city","neutral"],[9,8,"city","neutral"],[12,10,"factory","neutral"],[4,13,"city","neutral"],[10,12,"city","neutral"],
          [11,10,"city","red"],[13,12,"factory","red"],[12,13,"city","red"],[14,14,"hq","red"]
        ],
        units: [
          ["blue","infantry",1,0],["blue","tank",0,2],["blue","artillery",2,1],["blue","infantry",3,6],["blue","heavyTank",2,4],["blue","attackHeli",4,1],["blue","antiAir",4,2],
          ["red","infantry",13,14],["red","tank",14,12],["red","artillery",12,14],["red","infantry",11,10],["red","heavyTank",12,11],["red","attackHeli",10,13],["red","antiAir",10,12]
        ]
      }
    };

    let state;
    let selectedId = null;
    let enemyPreviewId = null;
    let selectedFacilityKey = null;
    let hoveredHex = null;
    let reachable = new Map();
    let attackable = new Set();
    let enemyReachable = new Map();
    let enemyAttackArea = new Set();
    let logLines = [];
    let gameState = "title";
    let titleAnimId = null;
    let audioContext = null;
    let sfxSettings = loadSfxSettings();
    let lastMove = null;
    let selectedScenarioId = DEFAULT_SCENARIO_ID;
    let scenarioStartMode = "playerVsCpu";
    let watchPaused = true;
    let watchStepRequested = false;
    let watchStopAfterTeam = null;
    let watchLoopRunning = false;
    let watchSession = 0;
    let watchSpeed = "normal";
    let aiValidationRunning = false;
    let aiValidationStopRequested = false;
    let aiValidationResults = loadAiValidationResults();
    let aiSettings = loadAiSettings();
    let validationMatchStats = null;
    const cpuCaptureAssignments = { blue: new Map(), red: new Map() };
    const cpuDefenseAssignments = { blue: new Map(), red: new Map() };
    const moveSoundTimes = new Map();

    const boardEl = document.getElementById("board");
    const ctx = boardEl.getContext("2d");
    const boardWrapEl = document.querySelector(".board-wrap");
    const infoEl = document.getElementById("info");
    const terrainInfoEl = document.getElementById("terrainInfo");
    const logEl = document.getElementById("log");
    const unitListEl = document.getElementById("unitList");
    const productionEl = document.getElementById("production");
    const toastEl = document.getElementById("toast");
    const turnMessageEl = document.getElementById("turnMessage");
    const watchControlsEl = document.getElementById("watchControls");
    const captureBtn = document.getElementById("captureBtn");
    const undoMoveBtn = document.getElementById("undoMoveBtn");
    const cancelBtn = document.getElementById("cancelBtn");
    const zoomInBtn = document.getElementById("zoomIn");
    const zoomOutBtn = document.getElementById("zoomOut");
    const battleModalEl = document.getElementById("battleModal");
    const battleContentEl = document.getElementById("battleContent");
    const battleCloseBtn = document.getElementById("battleClose");
    const battleSkipEl = document.getElementById("battleSkip");
    const titleScreenEl = document.getElementById("titleScreen");
    const titleCanvasEl = document.getElementById("titleCanvas");
    const titleCtx = titleCanvasEl.getContext("2d");
    const titlePanelEl = document.getElementById("titlePanel");
    const resultScreenEl = document.getElementById("resultScreen");
    const resultTitleEl = document.getElementById("resultTitle");
    const resultReasonEl = document.getElementById("resultReason");
    const exitDialogEl = document.getElementById("exitDialog");
    const exitGameBtn = document.getElementById("exitGame");
    let battleCloseResolver = null;

    function makeMap(scenarioId = DEFAULT_SCENARIO_ID) {
      const scenario = scenarioDefs[scenarioId] || scenarioDefs[DEFAULT_SCENARIO_ID];
      const map = Array.from({ length: SIZE }, (_, y) => Array.from({ length: SIZE }, (_, x) => makeCell(x, y, "plain")));
      placeTerrainSet(map, "forest", scenario.forests);
      placeTerrainSet(map, "mountain", scenario.mountains);
      placeCentralRiver(map, scenario.riverPath, scenario.bridges);
      placeTerrainSet(map, "plain", scenario.corridors || []);
      placeFacilities(map, scenario.facilities);
      validateScenarioReachability(map, scenarioId);
      return map;
    }

    function mapGroundReachable(map, start, goal) {
      if (!start || !goal) return false;
      const seen = new Set([key(start.x, start.y)]);
      const queue = [{ x: start.x, y: start.y }];
      while (queue.length) {
        const current = queue.shift();
        if (current.x === goal.x && current.y === goal.y) return true;
        for (const [nx, ny] of hexNeighbors(current.x, current.y)) {
          const cell = map[ny]?.[nx];
          if (!cell || !terrainDefs[cell.type]?.passable || seen.has(key(nx, ny))) continue;
          seen.add(key(nx, ny));
          queue.push({ x: nx, y: ny });
        }
      }
      return false;
    }

    function validateScenarioReachability(map, scenarioId) {
      const facilities = map.flat().filter(isProperty);
      const blueHq = facilities.find(cell => cell.type === "hq" && cell.owner === "blue");
      const redHq = facilities.find(cell => cell.type === "hq" && cell.owner === "red");
      const checks = [
        ["blue HQ to red HQ", blueHq, redHq],
        ["red HQ to blue HQ", redHq, blueHq],
        ...facilities.filter(cell => cell.owner === "neutral").flatMap(cell => [
          [`blue HQ to ${cell.type}(${cell.x},${cell.y})`, blueHq, cell],
          [`red HQ to ${cell.type}(${cell.x},${cell.y})`, redHq, cell]
        ])
      ];
      for (const [label, start, goal] of checks) {
        if (!mapGroundReachable(map, start, goal)) console.warn(`[Map validation:${scenarioId}] unreachable ${label}`);
      }
    }

    function makeCell(x, y, type) {
      return { x, y, type, owner: "neutral", capture: 0, captureTeam: null, captureDurability: 10, captureDurabilityMax: 10, capturePendingOwner: null, captureInProgressBy: null };
    }

    function placeTerrainSet(map, type, points) {
      for (const [x, y] of points) {
        if (map[y]?.[x]) map[y][x].type = type;
      }
    }

    function placeCentralRiver(map, riverPath, bridgePositions) {
      placeTerrainSet(map, "river", riverPath);
      placeTerrainSet(map, "bridge", bridgePositions);
    }

    function placeFacilities(map, facilities) {
      for (const [x, y, type, owner] of facilities) {
        Object.assign(map[y][x], makeCell(x, y, type), { owner });
      }
    }

    function newState(scenarioId = selectedScenarioId, gameMode = "playerVsCpu") {
      const resolvedScenarioId = scenarioDefs[scenarioId] ? scenarioId : DEFAULT_SCENARIO_ID;
      const scenario = scenarioDefs[resolvedScenarioId];
      return {
        scenarioId: resolvedScenarioId,
        scenarioName: scenario.name,
        mapId: scenario.mapId || "borderRiver",
        gameMode,
        map: makeMap(resolvedScenarioId),
        units: scenario.units.map(([team, type, x, y]) => unit(team, type, x, y)),
        active: "blue",
        turn: 1,
        money: { blue: 700, red: 800 },
        totalIncome: { blue: 0, red: 0 },
        pendingProductions: [],
        lastCpuProduction: { blue: null, red: null },
        aiProfileKeys: {
          blue: gameMode === "cpuVsCpu" ? aiSettings.watchBlueProfile : "balanced",
          red: gameMode === "cpuVsCpu" ? aiSettings.watchRedProfile : aiSettings.enemyProfile
        },
        sfxSettings: { ...sfxSettings },
        locked: false,
        animatingId: null,
        levelEffects: [],
        gameOver: false
      };
    }

    function unit(team, type, x, y) {
      const def = unitStatsFor(team, type);
      return {
        id: `${team}-${type}-${Math.random().toString(36).slice(2, 9)}`,
        team,
        type,
        x,
        y,
        hp: def.hp,
        movementType: def.movementType,
        targetTypes: [...def.targetTypes],
        count: MAX_UNIT_COUNT,
        maxCount: MAX_UNIT_COUNT,
        level: 1,
        xp: 0,
        exp: 0,
        moved: false,
        attacked: false,
        captured: false,
        hasMoved: false,
        hasAttacked: false,
        hasCaptured: false,
        hasActed: false,
        maxLevel: 5
      };
    }

    function unitStatsFor(team, type) {
      const base = unitDefs[type] || unitDefs.infantry;
      const faction = factionUnitStats[team]?.[type] || {};
      return { ...base, ...faction };
    }

    function unitStats(u) {
      return unitStatsFor(u?.team, u?.type);
    }

    function unitName(u) {
      return unitStats(u).name;
    }

    function unitNameFor(team, type) {
      return unitStatsFor(team, type).name;
    }

    function unitMovementType(u) {
      return u?.movementType || unitStats(u).movementType || "ground";
    }

    function unitTargetTypes(u) {
      const targets = u?.targetTypes || unitStats(u).targetTypes;
      return Array.isArray(targets) ? targets : ["ground"];
    }

    function canAttackTarget(attacker, defender) {
      return !!attacker && !!defender && unitTargetTypes(attacker).includes(unitMovementType(defender));
    }

    function getAiProfile(team, sourceState = state) {
      const keyName = sourceState?.aiProfileKeys?.[team] || (team === "red" ? aiSettings.enemyProfile : "balanced");
      return aiProfiles[keyName] || aiProfiles.balanced;
    }

    function getAiProfileKey(team, sourceState = state) {
      const keyName = sourceState?.aiProfileKeys?.[team] || (team === "red" ? aiSettings.enemyProfile : "balanced");
      return aiProfiles[keyName] ? keyName : "balanced";
    }

    function aiProfileOptions(selected = "balanced") {
      return Object.entries(aiProfiles).map(([keyName, profile]) =>
        `<option value="${keyName}" ${keyName === selected ? "selected" : ""}>${escapeHtml(profile.name)}</option>`
      ).join("");
    }

    function init(scenarioId = selectedScenarioId, gameMode = "playerVsCpu") {
      selectedScenarioId = scenarioDefs[scenarioId] ? scenarioId : DEFAULT_SCENARIO_ID;
      watchSession += 1;
      state = newState(selectedScenarioId, gameMode);
      lastMove = null;
      gameState = gameMode === "cpuVsCpu" ? "watch" : "playing";
      titleScreenEl.classList.remove("show");
      stopTitleAnimation();
      resultScreenEl.classList.remove("show");
      logLines = [`シナリオ「${state.scenarioName}」開始。赤軍司令部を占領してください。`];
      selectedFacilityKey = facilityKey(getProductionFacilities("blue")[0]);
      clearSelection();
      render();
      if (gameMode === "cpuVsCpu") {
        watchPaused = false;
        watchStepRequested = false;
        watchStopAfterTeam = null;
        runWatchLoop();
      }
    }

    function bootTitle() {
      watchSession += 1;
      watchPaused = true;
      state = newState(selectedScenarioId);
      lastMove = null;
      gameState = "title";
      logLines = ["タイトル画面を表示中です。"];
      selectedFacilityKey = facilityKey(getProductionFacilities("blue")[0]);
      clearSelection();
      titleScreenEl.classList.add("show");
      resultScreenEl.classList.remove("show");
      animateTitleScreen();
      render();
    }

    function showTitlePanel(kind) {
      titlePanelEl.classList.remove("ai-mode");
      titlePanelEl.parentElement?.classList.remove("ai-expanded");
      const panels = {
        how: `<strong>遊び方</strong><br>歩兵で都市・工場・司令部を占領します。敵部隊を全滅させるか、敵司令部を占領すると勝利です。川と山は通行不可です。橋を使って川を渡り、進軍ルートを確保してください。ユニットは10機編成で、損害を受けると戦闘力が下がります。都市・工場・司令部で残存部隊を補充できます。PCでは右クリック、スマホではキャンセルボタンで選択解除できます。`,
        settings: `<strong>設定</strong><br><label><input type="checkbox" id="settingBattle" checked> 戦闘アニメーションON</label><br><label>戦闘アニメーション速度：<select id="battleSpeedSetting"><option value="slow">遅い</option><option value="normal" selected>普通</option><option value="fast">速い</option></select></label><br><label><input type="checkbox" id="settingSfx"> 効果音 ON</label><br><label>音量 <input type="range" id="settingSfxVolume" min="0" max="100" step="5"></label><br><label>通常プレイの敵AI：<select id="enemyAiSetting">${aiProfileOptions(aiSettings.enemyProfile)}</select></label>`,
        credits: `<strong>クレジット</strong><br>Original browser strategy game prototype`
      };
      titlePanelEl.innerHTML = panels[kind] || "";
      titlePanelEl.classList.toggle("show", !!panels[kind]);
      const speedSelect = document.getElementById("battleSpeedSetting");
      if (speedSelect) {
        speedSelect.value = localStorage.getItem("frontline-hex-battle-speed") || "normal";
        speedSelect.addEventListener("change", () => localStorage.setItem("frontline-hex-battle-speed", speedSelect.value));
      }
      const sfxToggle = document.getElementById("settingSfx");
      const sfxVolume = document.getElementById("settingSfxVolume");
      if (sfxToggle && sfxVolume) {
        sfxToggle.checked = sfxSettings.enabled;
        sfxVolume.value = String(Math.round(sfxSettings.volume * 100));
        sfxToggle.addEventListener("change", () => {
          sfxSettings.enabled = sfxToggle.checked;
          saveSfxSettings();
          if (sfxSettings.enabled) {
            unlockAudio();
            playTurnSound();
          }
        });
        sfxVolume.addEventListener("input", () => {
          sfxSettings.volume = Number(sfxVolume.value) / 100;
          saveSfxSettings();
        });
      }
      const enemyAiSelect = document.getElementById("enemyAiSetting");
      if (enemyAiSelect) enemyAiSelect.addEventListener("change", () => {
        aiSettings.enemyProfile = aiProfiles[enemyAiSelect.value] ? enemyAiSelect.value : "balanced";
        saveAiSettings();
        showToast(`敵AIを${aiProfiles[aiSettings.enemyProfile].name}に設定しました。`);
      });
    }

    function showScenarioSelect(mode = "playerVsCpu") {
      titlePanelEl.classList.remove("ai-mode");
      titlePanelEl.parentElement?.classList.remove("ai-expanded");
      scenarioStartMode = mode === "cpuVsCpu" ? "cpuVsCpu" : "playerVsCpu";
      titlePanelEl.innerHTML = `
        <div class="scenario-heading">
          <strong>${scenarioStartMode === "cpuVsCpu" ? "観戦マップ選択" : "シナリオ・マップ選択"}</strong>
          <span>国境河川 / 山岳湖畔から作戦地域を選択</span>
        </div>
        ${scenarioStartMode === "cpuVsCpu" ? `<div class="watch-ai-select"><label>青軍AI<select id="watchBlueAi">${aiProfileOptions(aiSettings.watchBlueProfile)}</select></label><label>赤軍AI<select id="watchRedAi">${aiProfileOptions(aiSettings.watchRedProfile)}</select></label></div>` : ""}
        <div class="scenario-select">
          ${Object.entries(scenarioDefs).map(([id, scenario], index) => `
            <button class="scenario-card ${id === selectedScenarioId ? "selected" : ""}" type="button" data-scenario-id="${id}">
              <span class="scenario-number">0${index + 1}</span>
              <span class="scenario-copy">
                <strong>${escapeHtml(scenario.name)}</strong>
                <em>${escapeHtml(scenario.mapName || "国境河川マップ")}</em>
                <small>${escapeHtml(scenario.difficulty)}</small>
                <span>${escapeHtml(scenario.description)}</span>
              </span>
            </button>`).join("")}
        </div>`;
      titlePanelEl.classList.add("show");
      for (const button of titlePanelEl.querySelectorAll("[data-scenario-id]")) {
        button.addEventListener("click", () => startScenario(button.dataset.scenarioId));
      }
    }

    function startScenario(scenarioId) {
      if (!scenarioDefs[scenarioId]) return;
      if (scenarioStartMode === "cpuVsCpu") {
        const blueSelect = document.getElementById("watchBlueAi");
        const redSelect = document.getElementById("watchRedAi");
        aiSettings.watchBlueProfile = aiProfiles[blueSelect?.value] ? blueSelect.value : aiSettings.watchBlueProfile;
        aiSettings.watchRedProfile = aiProfiles[redSelect?.value] ? redSelect.value : aiSettings.watchRedProfile;
        saveAiSettings();
      }
      selectedScenarioId = scenarioId;
      init(scenarioId, scenarioStartMode);
      showToast(`「${scenarioDefs[scenarioId].name}」${scenarioStartMode === "cpuVsCpu" ? "の観戦" : ""}を開始しました。`);
    }

    function drawTitleScreen(time = 0) {
      if (!titleCanvasEl || !titleCtx) return;
      const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
      const w = titleScreenEl.clientWidth || window.innerWidth;
      const h = titleScreenEl.clientHeight || window.innerHeight;
      const pixelW = Math.round(w * dpr);
      const pixelH = Math.round(h * dpr);
      if (titleCanvasEl.width !== pixelW || titleCanvasEl.height !== pixelH) {
        titleCanvasEl.width = pixelW;
        titleCanvasEl.height = pixelH;
      }
      titleCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      titleCtx.clearRect(0, 0, w, h);
      const pulse = Math.sin(time / 900) * .5 + .5;
      const grd = titleCtx.createLinearGradient(0, 0, w, h);
      grd.addColorStop(0, "#07111d");
      grd.addColorStop(.52, "#142434");
      grd.addColorStop(1, "#100b12");
      titleCtx.fillStyle = grd;
      titleCtx.fillRect(0, 0, w, h);
      drawTitleHexBackground(titleCtx, w, h, time);
      drawTitleBattlefield(titleCtx, w, h, time);
      drawTitleInfantrySilhouette(titleCtx, w * .08, h * .35, 1, "blue", time);
      drawTitleInfantrySilhouette(titleCtx, w * .92, h * .35, -1, "red", time);
      const titleUnitSize = Math.min(w, h);
      drawTitleTank(titleCtx, w * .13, h * .76, titleUnitSize * .22, "blue", 1, time, pulse);
      drawTitleTank(titleCtx, w * .24, h * .82, titleUnitSize * .18, "blue", 1, time + 180, pulse);
      drawTitleHeavy(titleCtx, w * .35, h * .8, titleUnitSize * .19, "blue", 1, time, pulse);
      drawTitleTank(titleCtx, w * .87, h * .76, titleUnitSize * .23, "red", -1, time, pulse);
      drawTitleTank(titleCtx, w * .76, h * .82, titleUnitSize * .18, "red", -1, time + 180, pulse);
      drawTitleHeavy(titleCtx, w * .65, h * .8, titleUnitSize * .19, "red", -1, time, pulse);
      drawTitleButtons();
    }

    function drawTitleHexBackground(drawCtx, w, h, time) {
      const size = 34;
      const hw = Math.sqrt(3) * size;
      const offset = (time / 80) % (size * 1.5);
      drawCtx.save();
      drawCtx.globalAlpha = .18;
      drawCtx.strokeStyle = "rgba(210,230,250,.42)";
      drawCtx.lineWidth = 1;
      for (let row = -1; row < h / (size * 1.5) + 2; row++) {
        for (let col = -1; col < w / hw + 2; col++) {
          const cx = col * hw + (row % 2) * hw / 2;
          const cy = row * size * 1.5 + offset;
          drawTitleHex(drawCtx, cx, cy, size);
        }
      }
      drawCtx.restore();
    }

    function drawTitleHex(drawCtx, cx, cy, size) {
      drawCtx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = Math.PI / 180 * (60 * i - 30);
        const x = cx + size * Math.cos(angle);
        const y = cy + size * Math.sin(angle);
        if (i === 0) drawCtx.moveTo(x, y);
        else drawCtx.lineTo(x, y);
      }
      drawCtx.closePath();
      drawCtx.stroke();
    }

    function drawTitleBattlefield(drawCtx, w, h, time) {
      const y = h * .77;
      drawCtx.save();
      drawCtx.globalAlpha = .9;
      drawCtx.strokeStyle = "#2f7fc1";
      drawCtx.lineWidth = Math.max(10, h * .018);
      drawCtx.beginPath();
      drawCtx.moveTo(w * .08, y + 16);
      drawCtx.bezierCurveTo(w * .28, y - 28, w * .55, y + 38, w * .92, y - 10);
      drawCtx.stroke();
      drawCtx.strokeStyle = "#b9975d";
      drawCtx.lineWidth = Math.max(12, h * .024);
      drawCtx.beginPath();
      drawCtx.moveTo(w * .43, y + 2);
      drawCtx.lineTo(w * .57, y + 4);
      drawCtx.stroke();
      drawTitleCity(drawCtx, w * .5, y - 42, Math.max(26, h * .045));
      drawCtx.restore();
    }

    function drawTitleCity(drawCtx, x, y, size) {
      drawCtx.save();
      drawCtx.fillStyle = "rgba(160,183,200,.9)";
      for (let i = -2; i <= 2; i++) {
        const bw = size * .28;
        const bh = size * (.55 + ((i + 2) % 3) * .18);
        drawCtx.fillRect(x + i * bw * 1.1, y - bh, bw, bh);
      }
      drawCtx.restore();
    }

    function drawTitleTank(drawCtx, x, y, size, team, dir, time, pulse) {
      drawCtx.save();
      drawCtx.translate(x, y + Math.sin(time / 500) * 2);
      drawCtx.scale(dir, 1);
      drawTankSprite(drawCtx, 0, 0, size, team);
      drawCtx.fillStyle = team === "blue" ? `rgba(115,183,255,${.35 + pulse * .35})` : `rgba(255,138,138,${.35 + pulse * .35})`;
      drawCtx.beginPath();
      drawCtx.arc(size * .32, -size * .18, size * .08, 0, Math.PI * 2);
      drawCtx.fill();
      drawCtx.restore();
    }

    function drawTitleHeavy(drawCtx, x, y, size, team, dir, time, pulse) {
      drawCtx.save();
      drawCtx.translate(x, y + Math.cos(time / 520) * 2);
      drawCtx.scale(dir, 1);
      drawHeavyTankSprite(drawCtx, 0, 0, size, team);
      drawCtx.fillStyle = team === "blue" ? `rgba(115,183,255,${.28 + pulse * .32})` : `rgba(255,138,138,${.28 + pulse * .32})`;
      drawCtx.beginPath();
      drawCtx.arc(size * .36, -size * .2, size * .09, 0, Math.PI * 2);
      drawCtx.fill();
      drawCtx.restore();
    }

    function drawTitleInfantrySilhouette(drawCtx, x, y, dir, team, time) {
      drawCtx.save();
      drawCtx.translate(x, y);
      drawCtx.scale(dir, 1);
      drawCtx.globalAlpha = .38;
      for (let i = 0; i < 5; i++) {
        drawInfantrySprite(drawCtx, i * 24, Math.sin(time / 420 + i) * 4, 34, team);
      }
      drawArtillerySprite(drawCtx, 98, 18, 52, team);
      drawHeavyTankSprite(drawCtx, 155, 28, 62, team);
      drawCtx.restore();
    }

    function drawTitleButtons() {
      return true;
    }

    function animateTitleScreen() {
      if (titleAnimId) return;
      const step = time => {
        if (gameState !== "title") {
          titleAnimId = null;
          return;
        }
        drawTitleScreen(time);
        titleAnimId = requestAnimationFrame(step);
      };
      titleAnimId = requestAnimationFrame(step);
    }

    function stopTitleAnimation() {
      if (titleAnimId) cancelAnimationFrame(titleAnimId);
      titleAnimId = null;
    }

    function render() {
      resizeCanvasToViewport();
      drawBoard();
      renderStats();
      renderInfo();
      renderTerrainInfo();
      renderProduction();
      renderUnitList();
      renderLog();
    }

    function resizeCanvasToViewport() {
      const wrapRect = boardWrapEl.getBoundingClientRect();
      const mobile = window.innerWidth <= 760;
      const availableW = Math.max(300, Math.floor(wrapRect.width - (mobile ? 12 : 24)));
      const remainingH = Math.floor(window.innerHeight - wrapRect.top - (mobile ? 310 : 16));
      const availableH = Math.max(230, Math.min(Math.floor(wrapRect.height - (mobile ? 12 : 24)), remainingH));
      canvasCssWidth = Math.min(availableW, mobile ? availableW : BASE_CANVAS_W);
      canvasCssHeight = Math.min(availableH, mobile ? availableH : BASE_CANVAS_H);

      const sizeKey = `${canvasCssWidth}x${canvasCssHeight}:${mobile}`;
      const oldCenter = screenToWorld(canvasCssWidth / 2, canvasCssHeight / 2);
      const fitW = (canvasCssWidth - 70) / (Math.sqrt(3) * (SIZE - 0.5));
      const fitH = (canvasCssHeight - 58) / (2 + (SIZE - 1) * 1.5);
      BASE_HEX_SIZE = Math.max(mobile ? 16 : 22, Math.min(mobile ? 25 : 28, fitW, fitH));
      BASE_HEX_W = Math.sqrt(3) * BASE_HEX_SIZE;
      BASE_HEX_H = 2 * BASE_HEX_SIZE;
      HEX_SIZE = BASE_HEX_SIZE * zoomScale;
      HEX_W = Math.sqrt(3) * HEX_SIZE;
      HEX_H = 2 * HEX_SIZE;

      if (sizeKey !== lastCanvasSize) {
        const mapW = (BASE_HEX_W * (SIZE - 0.5) + BASE_HEX_SIZE) * zoomScale;
        const mapH = (BASE_HEX_H + (SIZE - 1) * BASE_HEX_SIZE * 1.5) * zoomScale;
        if (!lastCanvasSize) {
          mapOffsetX = (canvasCssWidth - mapW) / 2 + BASE_HEX_SIZE * zoomScale;
          mapOffsetY = (canvasCssHeight - mapH) / 2 + BASE_HEX_SIZE * zoomScale;
        } else {
          mapOffsetX = canvasCssWidth / 2 - oldCenter.x * zoomScale;
          mapOffsetY = canvasCssHeight / 2 - oldCenter.y * zoomScale;
        }
        lastCanvasSize = sizeKey;
      }
      MAP_OFFSET_X = mapOffsetX;
      MAP_OFFSET_Y = mapOffsetY;

      boardEl.style.width = `${canvasCssWidth}px`;
      boardEl.style.height = `${canvasCssHeight}px`;
      const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
      const pixelW = Math.round(canvasCssWidth * dpr);
      const pixelH = Math.round(canvasCssHeight * dpr);
      if (boardEl.width !== pixelW || boardEl.height !== pixelH) {
        boardEl.width = pixelW;
        boardEl.height = pixelH;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      clampPan();
    }

    function drawBoard() {
      ctx.clearRect(0, 0, canvasCssWidth, canvasCssHeight);
      ctx.fillStyle = "#091017";
      ctx.fillRect(0, 0, canvasCssWidth, canvasCssHeight);

      for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
          const cell = state.map[y][x];
          const { x: cx, y: cy } = hexToPixel(y, x);
          drawHex(ctx, cx, cy, terrainFill(cell), "#1f2a33", 1.2);
          drawTerrainDetail(cell, cx, cy);
          const enemyMoveInfo = enemyReachable.get(key(x, y));
          if (enemyMoveInfo) drawHexOverlay(cx, cy, enemyMoveInfo.zocStop ? "rgba(220, 82, 62, .24)" : "rgba(255, 145, 45, .28)", enemyMoveInfo.zocStop ? "rgba(255, 110, 90, .9)" : "rgba(255, 176, 74, .82)", enemyMoveInfo.zocStop ? 2.5 : 1.8);
          if (enemyAttackArea.has(key(x, y))) drawHexOverlay(cx, cy, "rgba(255, 70, 70, .08)", "rgba(255, 100, 100, .62)", 1.4);
          const moveInfo = reachable.get(key(x, y));
          if (moveInfo) drawHexOverlay(cx, cy, moveInfo.zocStop ? "rgba(118, 112, 210, .4)" : "rgba(64, 160, 255, .36)", moveInfo.zocStop ? "rgba(255, 120, 105, .95)" : "rgba(120, 200, 255, .9)", moveInfo.zocStop ? 2.8 : 2);
          if (attackable.has(key(x, y))) drawHexOverlay(cx, cy, "rgba(255, 70, 70, .34)", "rgba(255, 120, 120, .95)", 2.4);
          if (isProperty(cell) && facilityKey(cell) === selectedFacilityKey) drawHexOverlay(cx, cy, "rgba(255, 208, 90, .12)", "#ffd05a", 3);
          if (enemyPreviewId && state.units.find(u => u.id === enemyPreviewId)?.x === x && state.units.find(u => u.id === enemyPreviewId)?.y === y) drawHexOverlay(cx, cy, "rgba(255, 70, 70, .12)", "#ff6c6c", 3.4);
          if (selectedId && getSelected()?.x === x && getSelected()?.y === y) drawHexOverlay(cx, cy, "rgba(255, 208, 90, .08)", "#ffd05a", 3.2);
          drawFacility(cell, cx, cy, !!unitAt(x, y));
          if (isProperty(cell)) drawCapture(cell, cx, cy);
        }
      }

      for (const u of state.units) {
        const { x: cx, y: cy } = hexToPixel(u.y, u.x);
        drawUnit(u, cx, cy);
      }
      drawLevelEffects();
    }

    function drawLevelEffects() {
      if (!state.levelEffects) state.levelEffects = [];
      const now = Date.now();
      state.levelEffects = state.levelEffects.filter(effect => effect.until > now);
      for (const effect of state.levelEffects) {
        const { x: cx, y: cy } = hexToPixel(effect.y, effect.x);
        const t = Math.max(0, Math.min(1, (effect.until - now) / effect.duration));
        ctx.save();
        ctx.globalAlpha = Math.min(1, t * 1.6);
        ctx.fillStyle = "#ffd05a";
        ctx.strokeStyle = "#111820";
        ctx.lineWidth = 4;
        ctx.font = `900 ${Math.max(14, HEX_SIZE * .38)}px 'Segoe UI', sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeText(effect.text, cx, cy - HEX_SIZE * (1.05 + (1 - t) * .5));
        ctx.fillText(effect.text, cx, cy - HEX_SIZE * (1.05 + (1 - t) * .5));
        ctx.restore();
      }
    }

    function hexToPixel(row, col) {
      const p = hexToWorld(row, col);
      return worldToScreen(p.x, p.y);
    }

    function hexToWorld(row, col) {
      return {
        x: col * BASE_HEX_W + (row % 2) * (BASE_HEX_W / 2),
        y: row * (BASE_HEX_SIZE * 1.5)
      };
    }

    function worldToScreen(x, y) {
      return {
        x: mapOffsetX + x * zoomScale,
        y: mapOffsetY + y * zoomScale
      };
    }

    function screenToWorld(x, y) {
      return {
        x: (x - mapOffsetX) / zoomScale,
        y: (y - mapOffsetY) / zoomScale
      };
    }

    function getHexCorners(cx, cy) {
      const points = [];
      for (let i = 0; i < 6; i++) {
        const angle = Math.PI / 180 * (60 * i - 30);
        points.push({
          x: cx + HEX_SIZE * Math.cos(angle),
          y: cy + HEX_SIZE * Math.sin(angle)
        });
      }
      return points;
    }

    function drawHex(drawCtx, cx, cy, fillColor, strokeColor, lineWidth = 1) {
      const corners = getHexCorners(cx, cy);
      drawCtx.beginPath();
      drawCtx.moveTo(corners[0].x, corners[0].y);
      for (let i = 1; i < corners.length; i++) drawCtx.lineTo(corners[i].x, corners[i].y);
      drawCtx.closePath();
      drawCtx.fillStyle = fillColor;
      drawCtx.fill();
      drawCtx.strokeStyle = strokeColor;
      drawCtx.lineWidth = lineWidth;
      drawCtx.stroke();
    }

    function drawHexOverlay(cx, cy, fillColor, strokeColor, lineWidth) {
      drawHex(ctx, cx, cy, fillColor, strokeColor, lineWidth);
    }

    function terrainFill(cell) {
      if (cell.type === "hq") return cell.owner === "red" ? "#a94f55" : "#477caf";
      const colors = {
        plain: "#9bc977",
        forest: "#3f794d",
        mountain: "#85827a",
        city: "#9fb7c8",
        factory: "#64717d",
        river: "#2f7fc1",
        bridge: "#9f8d70"
      };
      return colors[cell.type] || "#9bc977";
    }

    function drawTerrainDetail(cell, cx, cy) {
      ctx.save();
      ctx.globalAlpha = .55;
      ctx.strokeStyle = "rgba(20, 30, 36, .45)";
      ctx.lineWidth = 2;
      if (cell.type === "river") {
        drawWaterConnections(cell, cx, cy);
      } else if (cell.type === "bridge") {
        drawWaterConnections(cell, cx, cy);
        ctx.strokeStyle = "rgba(70,52,34,.85)";
        ctx.lineWidth = Math.max(7, HEX_SIZE * .22);
        ctx.beginPath();
        ctx.moveTo(cx - HEX_SIZE * .65, cy + HEX_SIZE * .05);
        ctx.lineTo(cx + HEX_SIZE * .65, cy - HEX_SIZE * .05);
        ctx.stroke();
        ctx.strokeStyle = "rgba(230,218,190,.85)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = -2; i <= 2; i++) {
          const px = cx + i * HEX_SIZE * .22;
          ctx.moveTo(px - HEX_SIZE * .08, cy - HEX_SIZE * .18);
          ctx.lineTo(px + HEX_SIZE * .08, cy + HEX_SIZE * .18);
        }
        ctx.stroke();
      } else if (cell.type === "forest") {
        ctx.fillStyle = "#2e5738";
        ctx.beginPath(); ctx.arc(cx - 9, cy - 5, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 8, cy + 4, 6, 0, Math.PI * 2); ctx.fill();
      } else if (cell.type === "mountain") {
        ctx.fillStyle = "rgba(245,245,245,.52)";
        ctx.beginPath();
        ctx.moveTo(cx - 16, cy + 12);
        ctx.lineTo(cx - 4, cy - 12);
        ctx.lineTo(cx + 8, cy + 12);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "rgba(55,55,55,.35)";
        ctx.beginPath();
        ctx.moveTo(cx + 0, cy + 12);
        ctx.lineTo(cx + 12, cy - 8);
        ctx.lineTo(cx + 21, cy + 12);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    function drawWaterConnections(cell, cx, cy) {
      ctx.save();
      ctx.strokeStyle = "rgba(210,235,255,.5)";
      ctx.lineWidth = Math.max(3, HEX_SIZE * .12);
      ctx.lineCap = "round";
      for (const [nx, ny] of hexNeighbors(cell.x, cell.y)) {
        const neighbor = state.map[ny]?.[nx];
        if (!neighbor || (neighbor.type !== "river" && neighbor.type !== "bridge")) continue;
        const next = hexToPixel(ny, nx);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + (next.x - cx) * .55, cy + (next.y - cy) * .55);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawFacility(cell, cx, cy, hasUnit) {
      if (!isProperty(cell)) return;
      const icon = terrainDefs[cell.type].icon;
      const uiScale = Math.max(.86, Math.min(1.35, HEX_SIZE / 28));
      const iy = hasUnit ? cy - 13 : cy - 2;
      const ownerColor = cell.owner === "blue" ? "#1f7fff" : cell.owner === "red" ? "#e43b3b" : "#aeb7c2";
      const pendingColor = cell.capturePendingOwner === "blue" || cell.captureInProgressBy === "blue" ? "#73b7ff" : cell.capturePendingOwner === "red" || cell.captureInProgressBy === "red" ? "#ff8a8a" : null;
      ctx.save();
      ctx.fillStyle = cell.owner === "blue" ? "rgba(31,127,255,.92)" : cell.owner === "red" ? "rgba(228,59,59,.92)" : "rgba(170,180,190,.86)";
      ctx.strokeStyle = pendingColor || "#eef6ff";
      ctx.lineWidth = pendingColor ? 4 : 3;
      roundRect(ctx, cx - 17 * uiScale, iy - 13 * uiScale, 34 * uiScale, 25 * uiScale, 7);
      ctx.fill();
      ctx.stroke();
      if (pendingColor) {
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = pendingColor;
        ctx.lineWidth = 2;
        roundRect(ctx, cx - 21 * uiScale, iy - 17 * uiScale, 42 * uiScale, 33 * uiScale, 8);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.font = `${17 * uiScale}px 'Segoe UI Symbol', 'Noto Sans JP', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#f2f5f7";
      ctx.fillText(icon, cx, iy);
      ctx.fillStyle = ownerColor;
      ctx.beginPath();
      ctx.moveTo(cx - 13 * uiScale, iy + 15 * uiScale);
      ctx.lineTo(cx + 8 * uiScale, iy + 15 * uiScale);
      ctx.lineTo(cx + 8 * uiScale, iy + 21 * uiScale);
      ctx.lineTo(cx - 13 * uiScale, iy + 21 * uiScale);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    function drawCapture(cell, cx, cy) {
      if (!isProperty(cell)) return;
      const max = cell.captureDurabilityMax || 10;
      const durability = cell.captureDurability ?? max;
      if (durability >= max && !cell.capturePendingOwner && !cell.captureInProgressBy) return;
      ctx.save();
      ctx.fillStyle = "rgba(8, 12, 16, .82)";
      ctx.strokeStyle = cell.capturePendingOwner === "blue" || cell.captureInProgressBy === "blue" ? "#73b7ff" : cell.capturePendingOwner === "red" || cell.captureInProgressBy === "red" ? "#ff8a8a" : "rgba(255,255,255,.35)";
      ctx.lineWidth = 2;
      roundRect(ctx, cx - 26, cy + HEX_SIZE * .42, 52, 20, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#ffd05a";
      ctx.font = `${Math.max(10, HEX_SIZE * .22)}px 'Segoe UI', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`耐久 ${durability}/${max}`, cx, cy + HEX_SIZE * .42 + 10);
      ctx.restore();
    }

    function drawUnit(u, cx, cy, hexSize = HEX_SIZE) {
      const def = unitStats(u);
      const size = Math.max(22, Math.min(50, hexSize * 1.0));
      const uy = isProperty(state.map[u.y][u.x]) ? cy + hexSize * .28 : cy + hexSize * .04;
      const count = unitCount(u);
      ctx.save();
      if (isDone(u)) ctx.globalAlpha = .58;
      if (state.animatingId === u.id || u.id === selectedId) {
        ctx.beginPath();
        ctx.arc(cx, uy, size * .58, 0, Math.PI * 2);
        ctx.fillStyle = state.animatingId === u.id ? "rgba(255, 208, 90, .42)" : "rgba(255, 208, 90, .2)";
        ctx.fill();
        ctx.strokeStyle = "#ffd05a";
        ctx.lineWidth = Math.max(2, hexSize * .06);
        ctx.stroke();
      }
      drawUnitSprite(ctx, u, cx, uy, size);
      const countFont = Math.max(11, Math.min(18, hexSize * .34));
      ctx.font = `900 ${countFont}px 'Segoe UI', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#05080c";
      ctx.lineWidth = Math.max(3, countFont * .28);
      ctx.strokeText(String(count), cx + size * .36, uy + size * .32);
      ctx.fillStyle = "#fff";
      ctx.fillText(String(count), cx + size * .36, uy + size * .32);
      ctx.fillStyle = "#ffd05a";
      ctx.font = `800 ${Math.max(8, size * .16)}px 'Segoe UI', sans-serif`;
      ctx.fillText(`L${u.level || 1}`, cx - size * .36, uy - size * .32);
      if (isDone(u) || hasMovedOnly(u)) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = "rgba(8,12,16,.92)";
        ctx.beginPath();
        ctx.arc(cx + size * .33, uy - size * .3, size * .16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = Math.max(2, size * .06);
        if (isDone(u)) {
          ctx.beginPath();
          ctx.moveTo(cx + size * .25, uy - size * .31);
          ctx.lineTo(cx + size * .31, uy - size * .23);
          ctx.lineTo(cx + size * .43, uy - size * .39);
          ctx.stroke();
        } else {
          ctx.font = `900 ${Math.max(9, size * .2)}px 'Segoe UI', sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#fff";
          ctx.fillText("移", cx + size * .33, uy - size * .3);
        }
      }
      ctx.restore();
    }

    function drawUnitSprite(drawCtx, unit, x, y, size) {
      if (unit.type === "infantry") drawInfantrySprite(drawCtx, x, y, size, unit.team);
      else if (unit.type === "tank") drawTankSprite(drawCtx, x, y, size, unit.team);
      else if (unit.type === "heavyTank") drawHeavyTankSprite(drawCtx, x, y, size, unit.team);
      else if (unit.type === "artillery") drawArtillerySprite(drawCtx, x, y, size, unit.team);
      else if (unit.type === "attackHeli") drawHelicopterSprite(drawCtx, x, y, size, unit.team);
      else if (unit.type === "antiAir") drawAntiAirSprite(drawCtx, x, y, size, unit.team);
      else drawInfantrySprite(drawCtx, x, y, size, unit.team);
    }

    function teamPalette(team) {
      return team === "blue"
        ? { base: "#2d8cff", mid: "#166fc5", dark: "#0a3d72", light: "#cfe8ff", trim: "#061f38", accent: "#77d7ff" }
        : { base: "#f05252", mid: "#bd3333", dark: "#7c1818", light: "#ffe0e0", trim: "#3d0b0b", accent: "#ffb36b" };
    }

    function pixelRect(drawCtx, x, y, w, h, color) {
      drawCtx.fillStyle = color;
      drawCtx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    }

    function drawInfantrySprite(drawCtx, x, y, size, team) {
      const p = teamPalette(team);
      const s = size / 34;
      drawCtx.save();
      drawCtx.strokeStyle = "#071019";
      drawCtx.lineWidth = Math.max(2, s * 2.2);
      drawCtx.strokeRect(Math.round(x - 7*s), Math.round(y - 16*s), Math.round(14*s), Math.round(30*s));
      pixelRect(drawCtx, x - 4*s, y - 15*s, 8*s, 8*s, p.light);
      pixelRect(drawCtx, x - 6*s, y - 7*s, 12*s, 13*s, p.base);
      pixelRect(drawCtx, x - 11*s, y - 4*s, 6*s, 5*s, p.dark);
      pixelRect(drawCtx, x + 5*s, y - 2*s, 12*s, 4*s, p.accent);
      pixelRect(drawCtx, x - 5*s, y + 6*s, 4*s, 10*s, p.trim);
      pixelRect(drawCtx, x + 2*s, y + 6*s, 4*s, 10*s, p.trim);
      pixelRect(drawCtx, x - 7*s, y - 17*s, 14*s, 3*s, p.dark);
      drawCtx.restore();
    }

    function drawTankSprite(drawCtx, x, y, size, team) {
      const p = teamPalette(team);
      const s = size / (team === "blue" ? 40 : 43);
      drawCtx.save();
      drawCtx.strokeStyle = "#071019";
      drawCtx.lineWidth = Math.max(2, s * 2.4);
      drawCtx.strokeRect(Math.round(x - 18*s), Math.round(y - 10*s), Math.round(36*s), Math.round(25*s));
      pixelRect(drawCtx, x - 18*s, y + 5*s, 36*s, 9*s, p.trim);
      pixelRect(drawCtx, x - 15*s, y - 2*s, 30*s, 12*s, p.mid);
      if (team === "red") {
        drawCtx.fillStyle = p.dark;
        drawCtx.beginPath();
        drawCtx.ellipse(x, y - 5*s, 10*s, 7*s, 0, 0, Math.PI * 2);
        drawCtx.fill();
        pixelRect(drawCtx, x + 5*s, y - 7*s, 17*s, 4*s, p.accent);
      } else {
        pixelRect(drawCtx, x - 8*s, y - 10*s, 16*s, 10*s, p.dark);
        pixelRect(drawCtx, x + 4*s, y - 8*s, 19*s, 4*s, p.accent);
      }
      pixelRect(drawCtx, x - 13*s, y + 9*s, 5*s, 4*s, "#0b1016");
      pixelRect(drawCtx, x - 3*s, y + 9*s, 5*s, 4*s, "#0b1016");
      pixelRect(drawCtx, x + 8*s, y + 9*s, 5*s, 4*s, "#0b1016");
      pixelRect(drawCtx, x - 12*s, y + 1*s, 24*s, 3*s, p.light);
      drawCtx.restore();
    }

    function drawHeavyTankSprite(drawCtx, x, y, size, team) {
      const p = teamPalette(team);
      const s = size / (team === "blue" ? 42 : 45);
      drawCtx.save();
      drawCtx.strokeStyle = "#071019";
      drawCtx.lineWidth = Math.max(2, s * 2.7);
      drawCtx.strokeRect(Math.round(x - 21*s), Math.round(y - 13*s), Math.round(42*s), Math.round(29*s));
      pixelRect(drawCtx, x - 21*s, y + 5*s, 42*s, 11*s, p.trim);
      pixelRect(drawCtx, x - 18*s, y - 4*s, 36*s, 14*s, p.mid);
      if (team === "red") {
        drawCtx.fillStyle = p.dark;
        drawCtx.beginPath();
        drawCtx.ellipse(x, y - 7*s, 14*s, 9*s, 0, 0, Math.PI * 2);
        drawCtx.fill();
        pixelRect(drawCtx, x + 7*s, y - 10*s, 22*s, 5*s, p.accent);
      } else {
        pixelRect(drawCtx, x - 11*s, y - 14*s, 22*s, 13*s, p.dark);
        pixelRect(drawCtx, x + 7*s, y - 11*s, 25*s, 6*s, p.accent);
      }
      pixelRect(drawCtx, x - 15*s, y + 10*s, 6*s, 5*s, "#0b1016");
      pixelRect(drawCtx, x - 4*s, y + 10*s, 6*s, 5*s, "#0b1016");
      pixelRect(drawCtx, x + 8*s, y + 10*s, 6*s, 5*s, "#0b1016");
      pixelRect(drawCtx, x - 14*s, y + 0*s, 28*s, 4*s, p.light);
      pixelRect(drawCtx, x - 6*s, y - 17*s, 11*s, 4*s, p.light);
      drawCtx.restore();
    }

    function drawArtillerySprite(drawCtx, x, y, size, team) {
      const p = teamPalette(team);
      const s = size / (team === "blue" ? 40 : 43);
      drawCtx.save();
      drawCtx.strokeStyle = "#071019";
      drawCtx.lineWidth = Math.max(2, s * 2.3);
      drawCtx.strokeRect(Math.round(x - 17*s), Math.round(y - 10*s), Math.round(34*s), Math.round(25*s));
      pixelRect(drawCtx, x - 17*s, y + 5*s, 34*s, 9*s, p.trim);
      pixelRect(drawCtx, x - 14*s, y - 1*s, 28*s, 11*s, p.mid);
      pixelRect(drawCtx, x - 8*s, y - 9*s, 15*s, 8*s, p.dark);
      drawCtx.save();
      drawCtx.translate(x + 1*s, y - 9*s);
      drawCtx.rotate(team === "blue" ? -0.42 : -0.28);
      pixelRect(drawCtx, 0, -2*s, (team === "blue" ? 35 : 25)*s, 5*s, p.accent);
      pixelRect(drawCtx, (team === "blue" ? 30 : 21)*s, -3*s, 6*s, 7*s, p.light);
      drawCtx.restore();
      pixelRect(drawCtx, x - 12*s, y + 9*s, 5*s, 4*s, "#0b1016");
      pixelRect(drawCtx, x + 7*s, y + 9*s, 5*s, 4*s, "#0b1016");
      pixelRect(drawCtx, x - 12*s, y + 1*s, 24*s, 3*s, p.light);
      drawCtx.restore();
    }

    function drawHelicopterSprite(drawCtx, x, y, size, team) {
      const p = teamPalette(team);
      const s = size / 42;
      drawCtx.save();
      drawCtx.strokeStyle = "#071019";
      drawCtx.lineWidth = Math.max(2, s * 2.2);
      drawCtx.beginPath();
      drawCtx.ellipse(x - 4*s, y, 14*s, 9*s, 0, 0, Math.PI * 2);
      drawCtx.fillStyle = p.mid;
      drawCtx.fill();
      drawCtx.stroke();
      pixelRect(drawCtx, x - 1*s, y - 6*s, 9*s, 7*s, p.light);
      pixelRect(drawCtx, x + 8*s, y - 2*s, 19*s, 5*s, p.dark);
      pixelRect(drawCtx, x + 24*s, y - 8*s, 3*s, 16*s, p.accent);
      pixelRect(drawCtx, x - 18*s, y - 2*s, 7*s, 4*s, p.accent);
      pixelRect(drawCtx, x - 4*s, y - 15*s, 2*s, 9*s, p.trim);
      pixelRect(drawCtx, x - (team === "blue" ? 25 : 21)*s, y - 17*s, (team === "blue" ? 48 : 42)*s, 3*s, p.accent);
      pixelRect(drawCtx, x - 13*s, y + 10*s, 27*s, 3*s, "#0b1016");
      pixelRect(drawCtx, x - 10*s, y + 7*s, 2*s, 6*s, "#0b1016");
      pixelRect(drawCtx, x + 9*s, y + 7*s, 2*s, 6*s, "#0b1016");
      drawCtx.restore();
    }

    function drawAntiAirSprite(drawCtx, x, y, size, team) {
      const p = teamPalette(team);
      const s = size / 44;
      drawCtx.save();
      drawCtx.strokeStyle = "#071019";
      drawCtx.lineWidth = Math.max(2, s * 2.5);
      drawCtx.strokeRect(Math.round(x - 19*s), Math.round(y - 6*s), Math.round(38*s), Math.round(22*s));
      pixelRect(drawCtx, x - 19*s, y + 6*s, 38*s, 10*s, p.trim);
      pixelRect(drawCtx, x - 16*s, y - 1*s, 32*s, 12*s, p.mid);
      pixelRect(drawCtx, x - 8*s, y - 10*s, 15*s, 10*s, p.dark);

      // The oversized paired launcher gives the AA unit a distinct silhouette at map scale.
      drawCtx.save();
      drawCtx.translate(x - 3*s, y - 10*s);
      drawCtx.rotate(team === "blue" ? -0.58 : -0.48);
      for (let i = 0; i < 2; i++) {
        const tubeY = (-5 + i * 7) * s;
        pixelRect(drawCtx, -7*s, tubeY, 36*s, 4*s, i ? p.light : p.accent);
        pixelRect(drawCtx, 25*s, tubeY - 1*s, 7*s, 6*s, "#f4df9a");
      }
      pixelRect(drawCtx, -9*s, -7*s, 5*s, 17*s, p.trim);
      drawCtx.restore();

      // Rear radar dish and mast.
      pixelRect(drawCtx, x - 13*s, y - 17*s, 2.5*s, 10*s, p.light);
      drawCtx.beginPath();
      drawCtx.arc(x - 12*s, y - 18*s, 6*s, Math.PI * .15, Math.PI * 1.15);
      drawCtx.lineTo(x - 12*s, y - 18*s);
      drawCtx.closePath();
      drawCtx.fillStyle = p.light;
      drawCtx.fill();
      drawCtx.strokeStyle = "#071019";
      drawCtx.lineWidth = Math.max(1.5, 1.8*s);
      drawCtx.stroke();
      drawCtx.font = `900 ${Math.max(7, 8*s)}px 'Segoe UI', sans-serif`;
      drawCtx.textAlign = "center";
      drawCtx.textBaseline = "middle";
      drawCtx.lineWidth = Math.max(2, 2*s);
      drawCtx.strokeStyle = "#071019";
      drawCtx.strokeText("AA", x + 15*s, y - 16*s);
      drawCtx.fillStyle = "#fff4bd";
      drawCtx.fillText("AA", x + 15*s, y - 16*s);
      pixelRect(drawCtx, x - 13*s, y + 10*s, 6*s, 5*s, "#0b1016");
      pixelRect(drawCtx, x + 7*s, y + 10*s, 6*s, 5*s, "#0b1016");
      drawCtx.restore();
    }

    function roundRect(drawCtx, x, y, w, h, r) {
      drawCtx.beginPath();
      drawCtx.moveTo(x + r, y);
      drawCtx.lineTo(x + w - r, y);
      drawCtx.quadraticCurveTo(x + w, y, x + w, y + r);
      drawCtx.lineTo(x + w, y + h - r);
      drawCtx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      drawCtx.lineTo(x + r, y + h);
      drawCtx.quadraticCurveTo(x, y + h, x, y + h - r);
      drawCtx.lineTo(x, y + r);
      drawCtx.quadraticCurveTo(x, y, x + r, y);
      drawCtx.closePath();
    }

    function canvasPointToHex(clientX, clientY) {
      const { x: px, y: py } = clientToCanvasPoint(clientX, clientY);
      return getHexAtScreenPoint(px, py);
    }

    function clientToCanvasPoint(clientX, clientY) {
      const rect = boardEl.getBoundingClientRect();
      return {
        x: (clientX - rect.left) * (canvasCssWidth / rect.width),
        y: (clientY - rect.top) * (canvasCssHeight / rect.height)
      };
    }

    function getHexAtScreenPoint(px, py) {
      const point = screenToWorld(px, py);
      let best = null;
      let bestDistance = Infinity;
      for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
          const center = hexToWorld(y, x);
          const dist = Math.hypot(point.x - center.x, point.y - center.y);
          if (dist < bestDistance) {
            bestDistance = dist;
            best = { x, y };
          }
        }
      }
      return best && bestDistance <= BASE_HEX_SIZE * 1.05 ? best : null;
    }

    function handleCanvasClick(event) {
      const hex = canvasPointToHex(event.clientX, event.clientY);
      if (hex) onCellClick(hex.x, hex.y);
    }

    function handlePointerDown(event) {
      if (event.button !== undefined && event.button !== 0) return;
      event.preventDefault();
      if (!canPanMap() || state.locked) return;
      activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      boardEl.setPointerCapture?.(event.pointerId);
      if (activePointers.size === 2) {
        const points = [...activePointers.values()];
        pinchState = {
          startDistance: Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y),
          startZoom: zoomScale,
          moved: false
        };
        pointerState = null;
        return;
      }
      pointerState = {
        id: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,
        moved: false
      };
    }

    function handlePointerMove(event) {
      if (activePointers.has(event.pointerId)) activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pinchState && activePointers.size >= 2) {
        event.preventDefault();
        const points = [...activePointers.values()].slice(0, 2);
        const distance = Math.max(1, Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y));
        const centerClient = { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 };
        const center = clientToCanvasPoint(centerClient.x, centerClient.y);
        const nextZoom = pinchState.startZoom * (distance / Math.max(1, pinchState.startDistance));
        applyZoomAt(center.x, center.y, nextZoom, true);
        pinchState.moved = true;
        return;
      }
      if (pointerState && pointerState.id === event.pointerId) {
        const dx = event.clientX - pointerState.lastX;
        const dy = event.clientY - pointerState.lastY;
        const total = Math.hypot(event.clientX - pointerState.startX, event.clientY - pointerState.startY);
        if (total > 8) pointerState.moved = true;
        if (pointerState.moved) {
          mapOffsetX += dx;
          mapOffsetY += dy;
          clampPan();
          pointerState.lastX = event.clientX;
          pointerState.lastY = event.clientY;
          render();
          return;
        }
      }
      handleCanvasMove(event);
    }

    function handlePointerUp(event) {
      event.preventDefault();
      activePointers.delete(event.pointerId);
      if (pinchState) {
        if (activePointers.size < 2) pinchState = null;
        pointerState = null;
        boardEl.releasePointerCapture?.(event.pointerId);
        return;
      }
      if (!pointerState || pointerState.id !== event.pointerId) return;
      boardEl.releasePointerCapture?.(event.pointerId);
      const wasDrag = pointerState.moved;
      pointerState = null;
      if (!wasDrag && gameState === "playing" && !state.gameOver && !state.locked) handleCanvasClick(event);
    }

    function clampPan() {
      const mapW = (BASE_HEX_W * (SIZE - 0.5) + BASE_HEX_SIZE) * zoomScale;
      const mapH = (BASE_HEX_H + (SIZE - 1) * BASE_HEX_SIZE * 1.5) * zoomScale;
      const slack = Math.max(70, Math.min(canvasCssWidth, canvasCssHeight) * 0.18);
      mapOffsetX = Math.max(canvasCssWidth - mapW - slack, Math.min(slack, mapOffsetX));
      mapOffsetY = Math.max(canvasCssHeight - mapH - slack, Math.min(slack, mapOffsetY));
      MAP_OFFSET_X = mapOffsetX;
      MAP_OFFSET_Y = mapOffsetY;
    }

    function handleCanvasMove(event) {
      const hex = canvasPointToHex(event.clientX, event.clientY);
      const nextKey = hex ? key(hex.x, hex.y) : "";
      const currentKey = hoveredHex ? key(hoveredHex.x, hoveredHex.y) : "";
      if (nextKey !== currentKey) {
        hoveredHex = hex;
        render();
      }
    }

    function handleCanvasLeave() {
      if (hoveredHex) {
        hoveredHex = null;
        render();
      }
    }

    function terrainClass(cell) {
      if (cell.type === "hq") return cell.owner === "red" ? "hq-red" : "hq-blue";
      return cell.type;
    }

    function renderUnit(u) {
      const def = unitStats(u);
      const el = document.createElement("div");
      el.className = `unit ${u.team} ${def.heavy ? "heavy" : ""} ${isDone(u) ? "done" : ""} ${state.animatingId === u.id ? "animating" : ""}`;
      el.title = `${teamName[u.team]} ${def.name}`;
      el.textContent = def.short;
      const hp = document.createElement("span");
      hp.className = "hp";
      hp.textContent = u.hp;
      el.appendChild(hp);
      return el;
    }

    function renderStats() {
      document.getElementById("turnLabel").textContent = `${teamName[state.active]} ${state.turn}${state.locked ? " 行動中" : ""}`;
      document.getElementById("blueMoney").textContent = state.money.blue;
      document.getElementById("redMoney").textContent = state.money.red;
      document.getElementById("blueIncome").textContent = `収入 +${calculateIncome("blue")} / turn`;
      document.getElementById("redIncome").textContent = `収入 +${calculateIncome("red")} / turn`;
      const props = state.map.flat().filter(isProperty);
      const blue = props.filter(c => c.owner === "blue").length;
      const red = props.filter(c => c.owner === "red").length;
      document.getElementById("cityCount").textContent = `${blue} / ${red}`;
      const notPlaying = gameState !== "playing";
      document.getElementById("endTurn").disabled = notPlaying || state.locked || state.gameOver || state.active !== "blue";
      const pausedWatch = state.gameMode === "cpuVsCpu" && gameState === "watch" && watchPaused && !state.locked;
      document.getElementById("saveGame").disabled = (!pausedWatch && notPlaying) || state.locked;
      document.getElementById("loadGame").disabled = state.locked;
      document.getElementById("newGame").disabled = state.locked;
      exitGameBtn.disabled = notPlaying || state.locked || state.gameOver || battleModalEl.classList.contains("show");
      cancelBtn.disabled = notPlaying || state.locked || (!selectedId && !enemyPreviewId);
      const undoable = canUndoLastMove();
      undoMoveBtn.hidden = !undoable;
      undoMoveBtn.disabled = !undoable;
      zoomInBtn.disabled = state.locked;
      zoomOutBtn.disabled = state.locked;
      const watchMode = state.gameMode === "cpuVsCpu" && (gameState === "watch" || state.gameOver);
      watchControlsEl.hidden = !watchMode;
      if (watchMode) {
        document.getElementById("watchPause").disabled = watchPaused || state.gameOver;
        document.getElementById("watchResume").disabled = !watchPaused || state.gameOver;
        document.getElementById("watchStep").disabled = !watchPaused || state.locked || state.gameOver;
        document.getElementById("watchSpeed").value = watchSpeed;
      }
    }

    function renderInfo() {
      const u = getSelected();
      captureBtn.disabled = gameState !== "playing" || state.locked || !canCapture(u);
      if (!u) {
        const enemy = state.units.find(unit => unit.id === enemyPreviewId);
        if (enemy) {
          const def = unitStats(enemy);
          infoEl.innerHTML = `
            <div class="kv"><b>敵部隊予測</b><span>${teamName[enemy.team]} ${def.name}</span></div>
            <div class="kv"><b>編成</b><span>${strengthText(enemy)} / Lv ${enemy.level || 1}</span></div>
            <div class="kv"><b>次ターン</b><span>橙色：移動可能範囲 / 赤枠：攻撃可能範囲</span></div>
            <div class="kv"><b>性能</b><span>移動${def.move} / 射程${rangeText(def)} / ${movementTypeName(unitMovementType(enemy))}</span></div>
            <div class="kv"><b>解除</b><span>右クリックまたはキャンセル</span></div>`;
          return;
        }
        infoEl.innerHTML = `<div class="kv"><b>操作</b><span>青軍ユニットを選択してください。</span></div>
          <div class="kv"><b>移動</b><span>緑のヘックスが移動可能範囲です。</span></div>
          <div class="kv"><b>攻撃</b><span>赤く表示された敵ユニットをクリックします。</span></div>
          <div class="kv"><b>施設</b><span>司令部・都市・工場ではターン開始時に残存部隊を補充できます。</span></div>`;
        return;
      }
      const def = unitStats(u);
      const cell = state.map[u.y][u.x];
      const captureText = isProperty(cell)
        ? `耐久 ${cell.captureDurability ?? 10}/${cell.captureDurabilityMax || 10}${cell.captureInProgressBy ? ` / 占領中:${teamName[cell.captureInProgressBy]}` : ""}${cell.capturePendingOwner ? ` / 完了予定:${teamName[cell.capturePendingOwner]}` : ""}`
        : "-";
      infoEl.innerHTML = `
        <div class="kv"><b>部隊</b><span>${teamName[u.team]} ${def.name}</span></div>
        <div class="bars">
          ${meter("残存", unitCount(u), unitMaxCount(u))}
          ${meter("耐久", isProperty(cell) ? (cell.captureDurability ?? 10) : 0, isProperty(cell) ? (cell.captureDurabilityMax || 10) : 10)}
        </div>
        <div class="kv"><b>編成</b><span>${def.name} ${strengthText(u)}</span></div>
        <div class="kv"><b>練度</b><span>Lv ${u.level || 1} / EXP ${u.xp || 0}/100</span></div>
        <div class="kv"><b>性能</b><span>攻撃${effectiveAttack(u)}${def.airAttack ? ` / 対空${def.airAttack}` : ""} 防御${effectiveDefense(u)} 移動${def.move} 射程${rangeText(def)}</span></div>
        <div class="kv"><b>分類</b><span>${movementTypeName(unitMovementType(u))} / 対象:${unitTargetTypes(u).map(movementTypeName).join("・")}</span></div>
        <div class="kv"><b>状態</b><span>${hasMoved(u) ? "移動済み" : "移動可能"} / ${attackStatusText(u)} / ${hasCaptured(u) ? "占領済み" : "占領未実行"}</span></div>
        <div class="kv"><b>地形</b><span>${terrainDefs[cell.type].name} ${unitMovementType(u) === "air" ? "航空部隊は地形効果なし" : `防御+${terrainDefs[cell.type].defense}`}</span></div>
        <div class="kv"><b>占領</b><span>${captureText}</span></div>`;
    }

    function renderTerrainInfo() {
      if (!hoveredHex) {
        terrainInfoEl.innerHTML = `<div class="kv"><b>地形</b><span>ヘックスにマウスを乗せてください。</span></div>
          <div class="kv"><b>戦闘予測</b><span>攻撃可能な敵にマウスを乗せると予想ダメージを表示します。</span></div>`;
        return;
      }
      const cell = state.map[hoveredHex.y]?.[hoveredHex.x];
      if (!cell) return;
      const terrain = terrainDefs[cell.type];
      const unit = unitAt(hoveredHex.x, hoveredHex.y);
      const selected = getSelected();
      let prediction = "攻撃対象ではありません。";
      if (selected && unit && unit.team !== selected.team && attackable.has(key(unit.x, unit.y)) && canAttack(selected)) {
        const result = predictCombat(selected, unit, false);
        prediction = `${unitLabel(selected)}の攻撃で${unitLabel(unit)}が約${result.damageCount}機減る見込み。`;
        if (result.counterDamage > 0) prediction += ` 反撃で約${result.counterDamage}機失う可能性。`;
      }
      terrainInfoEl.innerHTML = `
        <div class="kv"><b>座標</b><span>(${hoveredHex.x},${hoveredHex.y})</span></div>
        <div class="kv"><b>地形</b><span>${terrain.name}${isProperty(cell) ? ` / ${teamName[cell.owner]}所有` : ""}</span></div>
        ${isProperty(cell) ? `<div class="kv"><b>施設</b><span>${facilityInfoText(cell)}</span></div>` : ""}
        <div class="kv"><b>防御補正</b><span>+${terrain.defense}</span></div>
        <div class="kv"><b>移動コスト</b><span>${terrainMoveLabel(terrain)}</span></div>
        <div class="kv"><b>部隊</b><span>${unit ? `${teamName[unit.team]} ${unitName(unit)} Lv${unit.level || 1}` : "なし"}</span></div>
        <div class="kv"><b>戦闘予測</b><span>${prediction}</span></div>`;
    }

    function facilityInfoText(cell) {
      const durability = `耐久 ${cell.captureDurability ?? 10}/${cell.captureDurabilityMax || 10}`;
      const labels = [];
      labels.push(`収入 +${facilityIncome(cell.type)}`);
      labels.push(`補充 +${getRepairAmount(cell)} / turn`);
      if (cell.owner !== "neutral" && isProductionFacility(cell, cell.owner)) labels.push("生産可能");
      if (cell.type === "hq") labels.push(cell.owner === "red" ? "占領で勝利" : "陥落で敗北");
      return `${teamName[cell.owner]}${terrainDefs[cell.type].name} / ${durability}${labels.length ? " / " + labels.join(" / ") : ""}`;
    }

    function meter(label, value, max) {
      const pct = max > 0 ? Math.max(0, Math.min(100, Math.round(value / max * 100))) : 0;
      return `<div class="meter"><label><span>${label}</span><span>${value}/${max}</span></label><div class="bar"><span style="width:${pct}%"></span></div></div>`;
    }

    function renderProduction() {
      const facilities = getProductionFacilities("blue");
      if (!facilities.length) {
        productionEl.innerHTML = `<div class="kv"><b>施設</b><span>占領中の工場または司令部がありません。</span></div>`;
        return;
      }
      if (!facilities.some(cell => facilityKey(cell) === selectedFacilityKey)) selectedFacilityKey = facilityKey(facilities[0]);
      const selectedFacility = facilities.find(cell => facilityKey(cell) === selectedFacilityKey);
      const queue = state.pendingProductions.filter(item => item.team === "blue");
      const facilityQueue = selectedFacility ? queue.filter(item => item.x === selectedFacility.x && item.y === selectedFacility.y) : [];
      productionEl.innerHTML = `
        <div class="facility-list">
          ${facilities.map(cell => {
            const hq = findHeadquarters("blue");
            const distance = hq ? hexDistance(cell.x, cell.y, hq.x, hq.y) : 0;
            return `<button class="facility-btn ${facilityKey(cell) === selectedFacilityKey ? "active" : ""}" data-facility="${facilityKey(cell)}">青軍${terrainDefs[cell.type].name} (${cell.x},${cell.y})<small>司令部から${distance} / 収入+${facilityIncome(cell.type)} / 補充+${getRepairAmount(cell)}</small></button>`;
          }).join("")}
        </div>
        <div class="kv"><b>生産</b><span>${selectedFacility ? `${terrainDefs[selectedFacility.type].name} (${selectedFacility.x},${selectedFacility.y})` : "-"}</span></div>
        <div class="product-grid">
          ${producibleTypes.map(type => {
            const def = unitStatsFor("blue", type);
            const disabled = gameState !== "playing" || state.money.blue < def.cost || state.active !== "blue" || state.locked || state.gameOver;
            return `<button class="product-btn" data-produce="${type}" ${disabled ? "disabled" : ""}>${def.name}<br>${def.cost}資金</button>`;
          }).join("")}
        </div>
        <div class="queue">
          <strong>生産予約</strong>
          ${facilityQueue.length ? facilityQueue.map(item => `<div>${unitNameFor(item.team, item.type)}：ターン終了時出撃</div>`).join("") : "<div>この施設の予約なし</div>"}
          ${queue.length !== facilityQueue.length ? `<div class="muted">全施設予約 ${queue.length}件</div>` : ""}
        </div>`;
      for (const btn of productionEl.querySelectorAll(".facility-btn")) {
        btn.addEventListener("click", () => {
          selectedFacilityKey = btn.dataset.facility;
          render();
        });
      }
      for (const btn of productionEl.querySelectorAll(".product-btn")) {
        btn.addEventListener("click", () => produceUnit(btn.dataset.produce));
      }
    }

    function renderUnitList() {
      const units = state.units.filter(u => u.team === "blue").sort((a, b) => a.y - b.y || a.x - b.x);
      unitListEl.innerHTML = units.map(u => {
        const def = unitStats(u);
        const flags = [
          hasMoved(u) ? "移" : "未移",
          canEverAttack(u) ? (hasAttacked(u) ? "攻" : hasMoved(u) && !canAttackAfterMove(u) ? "移後不可" : "未攻") : "非攻",
          hasCaptured(u) ? "占" : "",
        ].filter(Boolean).join(" / ");
        return `<div class="unit-row ${u.id === selectedId ? "selected-row" : ""}" data-unit-id="${u.id}">
          <div class="unit-badge">${def.short}</div>
          <div>
            <div class="unit-row-main"><span>${def.name} ${strengthText(u)} Lv${u.level || 1}</span><span>(${u.x},${u.y})</span></div>
            <div class="unit-row-sub">Lv ${u.level || 1} EXP ${u.xp || 0} / 残 ${strengthText(u)} / 攻 ${effectiveAttack(u)}${def.airAttack ? ` / 対空 ${def.airAttack}` : ""} / 防 ${effectiveDefense(u)} / 移 ${def.move} / 射 ${rangeText(def)} / ${flags}</div>
          </div>
        </div>`;
      }).join("");
      for (const row of unitListEl.querySelectorAll(".unit-row")) {
        row.addEventListener("click", () => selectUnit(row.dataset.unitId));
      }
    }

    function renderLog() {
      logEl.innerHTML = `<h2>戦闘ログ</h2>${logLines.slice(0, 18).map(line => `<p>${escapeHtml(line)}</p>`).join("")}`;
    }

    async function onCellClick(x, y) {
      if (gameState !== "playing" || state.gameOver || state.locked || state.active !== "blue") return;
      const clickedUnit = unitAt(x, y);
      const selected = getSelected();

      if (clickedUnit && clickedUnit.team === "blue") {
        selectUnit(clickedUnit.id);
        return;
      }

      if (clickedUnit && clickedUnit.team === "red") {
        if (selected && attackable.has(key(x, y)) && canAttack(selected)) {
          state.locked = true;
          render();
          await attack(selected, clickedUnit);
          markAttacked(selected);
          state.locked = false;
          checkVictory();
          if (state.units.includes(selected)) selectUnit(selected.id);
          else render();
        } else {
          selectEnemyPreview(clickedUnit.id);
        }
        return;
      }

      const clickedCell = state.map[y][x];
      if (!clickedUnit && isProductionFacility(clickedCell, "blue") && (!selected || !reachable.has(key(x, y)))) {
        selectedFacilityKey = facilityKey(clickedCell);
        clearSelection();
        render();
        return;
      }

      if (!selected) return;

      const pathInfo = reachable.get(key(x, y));
      if (!clickedUnit && pathInfo && canMove(selected)) {
        const fromX = selected.x;
        const fromY = selected.y;
        selected.x = x;
        selected.y = y;
        markMoved(selected);
        lastMove = { unitId: selected.id, fromX, fromY, toX: x, toY: y, turn: state.turn, team: state.active, cancelable: true };
        playMovePathSounds(selected, pathInfo.path);
        addLog(`${unitLabel(selected)}が移動。`);
        if (pathInfo.zocStop) addLog("敵部隊の支配地域へ進入したため、ここで移動終了です。");
        checkVictory();
        selectUnit(selected.id);
      }
    }

    function selectUnit(id) {
      const u = state.units.find(unit => unit.id === id);
      if (!u || u.team !== state.active || state.locked) return;
      selectedId = id;
      enemyPreviewId = null;
      enemyReachable = new Map();
      enemyAttackArea = new Set();
      if (isDone(u)) {
        reachable = new Map();
        attackable = new Set();
        addLog("このユニットは行動済みです。");
      } else {
        reachable = canMove(u) ? getReachable(u) : new Map();
        attackable = canAttack(u) ? getAttackableCells(u) : new Set();
      }
      render();
    }

    function clearSelection() {
      selectedId = null;
      enemyPreviewId = null;
      reachable = new Map();
      attackable = new Set();
      enemyReachable = new Map();
      enemyAttackArea = new Set();
    }

    function selectEnemyPreview(id) {
      const enemy = state.units.find(unit => unit.id === id && unit.team !== state.active);
      if (!enemy || state.locked) return;
      selectedId = null;
      reachable = new Map();
      attackable = new Set();
      enemyPreviewId = enemy.id;
      enemyReachable = getReachable(enemy);
      enemyAttackArea = getPredictedAttackArea(enemy, enemyReachable);
      render();
    }

    function getPredictedAttackArea(u, moves) {
      const area = new Set();
      const origins = [{ x: u.x, y: u.y }, ...[...moves.keys()].map(position => {
        const [x, y] = position.split(",").map(Number);
        return { x, y };
      })];
      const canAttackAfterMoving = canAttackAfterMove(u);
      for (const origin of origins) {
        if (!canAttackAfterMoving && (origin.x !== u.x || origin.y !== u.y)) continue;
        for (let y = 0; y < SIZE; y++) {
          for (let x = 0; x < SIZE; x++) {
            const distance = hexDistance(origin.x, origin.y, x, y);
            if (distance >= getMinAttackRange(u) && distance <= unitStats(u).range) area.add(key(x, y));
          }
        }
      }
      return area;
    }

    function cancelSelection() {
      if (gameState !== "playing" || state.locked) return;
      clearSelection();
      addLog("選択をキャンセルしました。");
      render();
    }

    function canUndoLastMove() {
      if (!lastMove?.cancelable || gameState !== "playing" || state.locked || state.gameOver || state.active !== "blue") return false;
      if (lastMove.turn !== state.turn || lastMove.team !== state.active || selectedId !== lastMove.unitId) return false;
      const u = state.units.find(unit => unit.id === lastMove.unitId);
      if (!u || u.x !== lastMove.toX || u.y !== lastMove.toY || hasAttacked(u) || hasCaptured(u)) return false;
      return !unitAt(lastMove.fromX, lastMove.fromY);
    }

    function undoLastMove() {
      if (!canUndoLastMove()) return false;
      const u = state.units.find(unit => unit.id === lastMove.unitId);
      u.x = lastMove.fromX;
      u.y = lastMove.fromY;
      u.hasMoved = false;
      u.moved = false;
      u.hasActed = false;
      lastMove = null;
      addLog(`${unitLabel(u)}の移動を取り消しました。`);
      selectUnit(u.id);
      return true;
    }

    function getSelected() {
      return state.units.find(u => u.id === selectedId);
    }

    function hexNeighbors(x, y) {
      const dirsEven = [[1,0],[-1,0],[0,-1],[-1,-1],[0,1],[-1,1]];
      const dirsOdd = [[1,0],[-1,0],[1,-1],[0,-1],[1,1],[0,1]];
      const dirs = y % 2 ? dirsOdd : dirsEven;
      return dirs.map(([dx, dy]) => [x + dx, y + dy]).filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < SIZE && ny < SIZE);
    }

    function getReachable(u) {
      const def = unitStats(u);
      const maxCost = def.move;
      const start = key(u.x, u.y);
      const costs = new Map([[start, { cost: 0, path: [] }]]);
      const queue = [{ x: u.x, y: u.y, cost: 0, path: [] }];
      while (queue.length) {
        queue.sort((a, b) => a.cost - b.cost);
        const cur = queue.shift();
        for (const [nx, ny] of hexNeighbors(cur.x, cur.y)) {
          const occupant = unitAt(nx, ny);
          const isAir = unitMovementType(u) === "air";
          if (occupant) continue;
          if (!canEnterTerrain(u, nx, ny)) continue;
          const step = isAir ? 1 : terrainDefs[state.map[ny][nx].type].move;
          const nextCost = cur.cost + step;
          const k = key(nx, ny);
          if (nextCost <= maxCost && (!costs.has(k) || nextCost < costs.get(k).cost)) {
            const path = [...cur.path, { x: nx, y: ny }];
            const zocStop = !isAir && isEnemyZoc(nx, ny, u.team);
            costs.set(k, { cost: nextCost, path, zocStop });
            if (!zocStop) queue.push({ x: nx, y: ny, cost: nextCost, path });
          }
        }
      }
      costs.delete(start);
      for (const other of state.units) costs.delete(key(other.x, other.y));
      return costs;
    }

    function isEnemyZoc(x, y, team) {
      return state.units.some(enemy =>
        enemy.team !== team && unitCount(enemy) > 0 && unitMovementType(enemy) === "ground" && hexDistance(x, y, enemy.x, enemy.y) === 1
      );
    }

    function canEnterTerrain(u, x, y) {
      return isPassableTerrain(u, state.map[y][x].type);
    }

    function isPassableTerrain(u, terrainType) {
      if (unitMovementType(u) === "air") return true;
      const terrain = terrainDefs[terrainType];
      if (!terrain || terrain.passable === false || !Number.isFinite(terrain.move)) return false;
      return true;
    }

    function terrainMoveLabel(terrain) {
      return terrain.passable === false || !Number.isFinite(terrain.move) ? "移動不可" : terrain.move;
    }

    function getAttackableCells(u) {
      const set = new Set();
      for (const enemy of state.units.filter(other => other.team !== u.team)) {
        if (isTargetInAttackRange(u, enemy)) set.add(key(enemy.x, enemy.y));
      }
      return set;
    }

    function getMinAttackRange(u) {
      if (!u) return 1;
      if (u.type === "artillery" || u.type === "antiAir") return 2;
      return unitStats(u).minRange || 1;
    }

    function isTargetInAttackRange(attacker, defender) {
      if (!attacker || !defender || !canAttackTarget(attacker, defender)) return false;
      const distance = hexDistance(attacker.x, attacker.y, defender.x, defender.y);
      return distance >= getMinAttackRange(attacker) && distance <= unitStats(attacker).range && hasLineOfSight(attacker, defender);
    }

    function hasLineOfSight(attacker, defender) {
      return !!attacker && !!defender;
    }

    function offsetToCube(x, y) {
      const q = x - (y - (y & 1)) / 2;
      const r = y;
      return { q, r, s: -q - r };
    }

    function hexDistance(ax, ay, bx, by) {
      const a = offsetToCube(ax, ay);
      const b = offsetToCube(bx, by);
      return Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r), Math.abs(a.s - b.s));
    }

    function unitMaxCount(u) {
      return Math.max(1, u?.maxCount || MAX_UNIT_COUNT);
    }

    function unitCount(u) {
      return Math.max(0, Math.min(unitMaxCount(u), u?.count ?? unitMaxCount(u)));
    }

    function setUnitCount(u, count) {
      u.maxCount = unitMaxCount(u);
      u.count = Math.max(0, Math.min(u.maxCount, count));
      const def = unitStats(u);
      if (def) u.hp = Math.max(0, Math.min(def.hp, Math.round(def.hp * (u.count / u.maxCount))));
    }

    function strengthText(u) {
      return `${unitCount(u)}/${unitMaxCount(u)}`;
    }

    function rangeText(def) {
      return def.minRange && def.minRange > 1 ? `${def.minRange}-${def.range}` : String(def.range);
    }

    function movementTypeName(type) {
      return type === "air" ? "航空" : type === "naval" ? "海上" : "地上";
    }

    function unitAffinity(attacker, defender) {
      if (attacker.type === "antiAir" && unitMovementType(defender) === "air") return 1.45;
      if (attacker.type === "attackHeli" && defender.type === "tank") return 1.2;
      if (attacker.type === "attackHeli" && defender.type === "heavyTank") return .9;
      if (attacker.type === "attackHeli" && defender.type === "infantry") return 1.3;
      if (attacker.type === "attackHeli" && defender.type === "artillery") return 1.35;
      if (attacker.type === "attackHeli" && defender.type === "antiAir") return .65;
      if (attacker.type === "attackHeli" && unitMovementType(defender) === "air") return .9;
      if (attacker.type === "infantry" && (defender.type === "tank" || defender.type === "heavyTank")) return .65;
      if ((attacker.type === "tank" || attacker.type === "heavyTank") && defender.type === "infantry") return 1.2;
      if (attacker.type === "heavyTank" && defender.type === "tank") return 1.25;
      if (attacker.type === "artillery" && defender.type !== "infantry") return 1.12;
      return 1;
    }

    async function attack(attacker, defender) {
      const result = predictCombat(attacker, defender);
      await showBattleScene(attacker, defender, result);
      applyBattleResult(attacker, defender, result);
    }

    function applyBattleResult(attacker, defender, result) {
      if (!state.units.includes(attacker)) return;
      if (state.units.includes(defender)) {
        setUnitCount(defender, result.defenderAfter);
      }
      gainExperience(attacker, result.attackDamage * 10);
      addLog(`${unitLabel(attacker)}が${unitLabel(defender)}を攻撃。${unitLabel(defender)} ${result.defenderBefore}→${result.defenderAfter}`);
      if (result.defenderAfter <= 0) {
        if (validationMatchStats) validationMatchStats.kills[attacker.team] += 1;
        addLog(`${unitLabel(defender)}部隊を撃破。`);
        gainExperience(attacker, 30);
        state.units = state.units.filter(u => u.id !== defender.id);
      } else if (result.countered && result.counterDamage > 0 && state.units.includes(defender)) {
        setUnitCount(attacker, result.attackerAfter);
        gainExperience(defender, result.counterDamage * 10);
        addLog(`${unitLabel(defender)}が反撃。${unitLabel(attacker)} ${result.attackerBefore}→${result.attackerAfter}`);
        if (result.attackerAfter <= 0) {
          if (validationMatchStats) validationMatchStats.kills[defender.team] += 1;
          addLog(`${unitLabel(attacker)}部隊を撃破。`);
          state.units = state.units.filter(u => u.id !== attacker.id);
          selectedId = null;
        }
      } else if (result.counterBlockedReason && state.units.includes(defender)) {
        addLog(`${unitLabel(defender)}は${result.counterBlockedReason}。`);
      }
    }

    function showBattleScene(attacker, defender, result) {
      const attackerDef = unitStats(attacker);
      const defenderDef = unitStats(defender);
      const defenderTerrain = terrainDefs[state.map[defender.y]?.[defender.x]?.type] || terrainDefs.plain;
      const attackerTerrain = terrainDefs[state.map[attacker.y]?.[attacker.x]?.type] || terrainDefs.plain;
      const destroyed = result.defenderAfter <= 0;
      const airToGround = unitMovementType(attacker) === "air" && unitMovementType(defender) === "ground";
      const antiAirIntercept = isAntiAirVsAirBattle(attacker, defender);
      const counterText = result.counterDamage > 0
        ? `<br>${escapeHtml(unitLabel(defender))}の反撃。${escapeHtml(unitLabel(attacker))} ${result.attackerBefore}→${result.attackerAfter}。`
        : "";
      battleContentEl.innerHTML = `
        <div class="battle-field ${airToGround ? "air-ground" : ""} ${antiAirIntercept ? "anti-air-intercept" : ""}">
          <div class="battle-sides">
            <div class="battle-card ${attacker.team} advance" data-battle-card="attacker" style="--advance:${attacker.team === "blue" ? "9px" : "-9px"}">
              <div class="battle-name">${escapeHtml(teamName[attacker.team])} ${escapeHtml(attackerDef.name)}</div>
              <div class="battle-count" data-count-label="attacker">残存 ${result.attackerBefore}/${unitMaxCount(attacker)}</div>
              ${strengthIcons(result.attackerBefore, unitMaxCount(attacker), "attacker", attacker)}
              <div>攻撃 ${effectiveAttackAgainst(attacker, defender)} / 防御 ${effectiveDefense(attacker)}</div>
              <div>地形 ${escapeHtml(attackerTerrain.name)} 防御+${terrainDefenseFor(attacker)}</div>
            </div>
            <div class="battle-vs">VS</div>
            <div class="battle-card ${defender.team} shake" data-battle-card="defender">
              <div class="battle-name">${escapeHtml(teamName[defender.team])} ${escapeHtml(defenderDef.name)}</div>
              <div class="battle-count" data-count-label="defender">残存 ${result.defenderBefore}/${unitMaxCount(defender)}</div>
              ${strengthIcons(result.defenderBefore, unitMaxCount(defender), "defender", defender)}
              <div>${canCounterAttack(defender, attacker) ? `反撃 ${effectiveAttackAgainst(defender, attacker)}` : "反撃不可"} / 防御 ${effectiveDefense(defender)}</div>
              <div>地形 ${escapeHtml(defenderTerrain.name)} 防御+${terrainDefenseFor(defender)}</div>
            </div>
          </div>
          <div class="battle-fx-layer">
            <span class="battle-callout">FIRE!</span>
            <span class="battle-callout hit">HIT!</span>
            ${destroyed ? `<span class="battle-callout destroyed">撃破！</span>` : ""}
            ${battleProjectiles(attacker, result.attackerBefore, false, defender, result.defenderBefore)}
            ${battleImpacts(attacker, result.attackDamage, false, result.defenderBefore, defender)}
            ${result.countered && result.counterDamage > 0 ? `
              ${battleProjectiles(defender, result.defenderAfter, true, attacker, result.attackerBefore)}
              ${battleImpacts(defender, result.counterDamage, true, result.attackerBefore, attacker)}` : ""}
          </div>
        </div>
        <div class="battle-result">
          ${escapeHtml(attackerDef.name)}の攻撃。${escapeHtml(unitLabel(defender))} ${result.defenderBefore}→${result.defenderAfter}。<br>
          損害 ${result.attackDamage}機。${counterText}
        </div>`;
      battleModalEl.classList.add("show");
      for (const effect of battleContentEl.querySelectorAll(".battle-projectile, .battle-impact")) {
        effect.addEventListener("animationend", () => effect.remove(), { once: true });
      }
      setTimeout(() => playFireSound(attacker), battleSkipEl.checked ? 40 : 500);
      setTimeout(playExplosionSound, battleSkipEl.checked ? 100 : antiAirIntercept ? 2100 : 1350);
      if (result.countered && result.counterDamage > 0) setTimeout(() => playFireSound(defender), battleSkipEl.checked ? 180 : 2200);
      const speed = getBattleSpeedConfig();
      const duration = battleSkipEl.checked ? 650 : speed.duration + speed.hold;
      const timers = [];
      return new Promise(resolve => {
        const defenderHitDelay = antiAirIntercept ? Math.max(speed.hitDelay, 2450) : attacker.type === "attackHeli" ? Math.max(speed.hitDelay, 2000) : speed.hitDelay;
        timers.push(...animateStrengthChange("defender", result.defenderBefore, result.defenderAfter, unitMaxCount(defender), battleSkipEl.checked ? 120 : defenderHitDelay, speed.step));
        if (result.countered) {
          timers.push(...animateStrengthChange("attacker", result.attackerBefore, result.attackerAfter, unitMaxCount(attacker), battleSkipEl.checked ? 180 : speed.counterDelay, speed.step));
        }
        const close = () => {
          for (const id of timers) clearTimeout(id);
          clearTimeout(timer);
          battleModalEl.classList.remove("show");
          battleCloseResolver = null;
          resolve();
        };
        battleCloseResolver = close;
        const timer = setTimeout(close, duration);
      });
    }

    function battleSpriteFxPosition(index, upper) {
      return { x: 29 + (index % 5) * 10.5, y: (upper ? 27 : 69) + Math.floor(index / 5) * 7 };
    }

    function isAntiAirVsAirBattle(attacker, defender) {
      return attacker?.type === "antiAir" && unitMovementType(defender) === "air";
    }

    function battleInterceptPosition(index, airborne) {
      return { x: (airborne ? 54 : 18) + (index % 5) * 7, y: (airborne ? 18 : 68) + Math.floor(index / 5) * 7 };
    }

    function battleProjectiles(unit, count, reverse, target = null, targetCount = MAX_UNIT_COUNT) {
      const shots = Math.max(1, Math.min(10, count));
      let html = "";
      for (let i = 0; i < shots; i++) {
        const top = 72 + (i % 5) * 9;
        const delay = reverse ? 2.15 + i * .085 : unit.type === "attackHeli" ? .48 + i * .065 : .52 + i * .085;
        const fly = unit.type === "attackHeli" ? .58 : .9;
        const intercept = target && isAntiAirVsAirBattle(unit, target);
        const trajectory = intercept ? "anti-air-intercept" : target && unitMovementType(unit) === "air" && unitMovementType(target) === "ground"
          ? "air-to-ground"
          : target && unitMovementType(unit) === "ground" && unitMovementType(target) === "air" ? "ground-to-air" : "";
        let positionStyle = "";
        if (trajectory) {
          const targetIndex = i % Math.max(1, Math.min(MAX_UNIT_COUNT, targetCount));
          const source = intercept ? battleInterceptPosition(i, false) : battleSpriteFxPosition(i, !reverse);
          const destination = intercept ? battleInterceptPosition(targetIndex, true) : battleSpriteFxPosition(targetIndex, reverse);
          positionStyle = `--sx:${source.x}%;--sy:${source.y}%;--ex:${destination.x}%;--ey:${destination.y}%;`;
        }
        html += `<span class="battle-projectile ${unit.type} ${trajectory} ${reverse ? "counter" : ""}" style="--top:${top}px;--delay:${delay}s;--fly:${fly}s;${positionStyle}"></span>`;
      }
      return html;
    }

    function battleImpacts(unit, damage, reverse, targetCount = 10, target = null) {
      const concentrated = targetCount <= 2 && unitCount(unit) >= 6;
      const booms = unit.type === "attackHeli"
        ? Math.max(1, Math.min(10, unitCount(unit)))
        : Math.max(1, Math.min(concentrated ? 8 : unit.type === "infantry" ? 4 : 6, Math.max(damage, Math.ceil(unitCount(unit) / 3))));
      let html = "";
      for (let i = 0; i < booms; i++) {
        const top = 72 + (i % 2) * 20;
        const shotDelay = reverse ? 2.15 + i * .085 : unit.type === "attackHeli" ? .48 + i * .065 : .52 + i * .085;
        const delay = shotDelay + (unit.type === "attackHeli" ? .58 : .82);
        const intercept = target && isAntiAirVsAirBattle(unit, target);
        const trajectory = intercept ? "anti-air-intercept" : target && unitMovementType(unit) === "air" && unitMovementType(target) === "ground"
          ? "air-to-ground"
          : target && unitMovementType(unit) === "ground" && unitMovementType(target) === "air" ? "ground-to-air" : "";
        const targetIndex = i % Math.max(1, Math.min(MAX_UNIT_COUNT, targetCount));
        const impact = intercept ? battleInterceptPosition(targetIndex, true) : trajectory ? battleSpriteFxPosition(targetIndex, reverse) : null;
        const impactStyle = impact ? `--ix:${impact.x}%;--iy:${impact.y}%;` : "";
        html += `<span class="battle-impact ${unit.type} ${trajectory} ${concentrated ? "concentrated" : ""} ${reverse ? "counter" : ""}" style="--top:${top}px;--delay:${delay}s;${impactStyle}"></span>`;
      }
      return html;
    }

    function animateStrengthChange(role, from, to, max, delay, stepMs) {
      const timers = [];
      const diff = Math.abs(from - to);
      if (!diff) {
        timers.push(setTimeout(() => updateBattleStrengthDisplay(role, to, max), delay));
        return timers;
      }
      for (let i = 1; i <= diff; i++) {
        const next = from + Math.sign(to - from) * i;
        timers.push(setTimeout(() => updateBattleStrengthDisplay(role, next, max), delay + (i - 1) * stepMs));
      }
      return timers;
    }

    function getBattleSpeedConfig() {
      const speed = localStorage.getItem("frontline-hex-battle-speed") || "normal";
      if (speed === "slow") return { duration: 4200, hitDelay: 1900, counterDelay: 3400, step: 360, hold: 2500 };
      if (speed === "fast") return { duration: 3000, hitDelay: 1400, counterDelay: 3000, step: 120, hold: 800 };
      return { duration: 3200, hitDelay: 1450, counterDelay: 3100, step: 220, hold: 1500 };
    }

    function strengthIcons(count, max = MAX_UNIT_COUNT, role = "", unit = null) {
      let html = `<div class="strength-icons" data-strength="${role}" aria-label="${count}/${max}">`;
      const type = unit?.type || "tank";
      const team = unit?.team || "";
      for (let i = 1; i <= max; i++) html += `<span class="mini-${type} ${team} ${i > count ? "lost" : ""}"></span>`;
      return `${html}</div>`;
    }

    function updateBattleStrengthDisplay(role, count, max) {
      const el = battleContentEl.querySelector(`[data-strength="${role}"]`);
      if (!el) return;
      el.setAttribute("aria-label", `${count}/${max}`);
      [...el.children].forEach((child, index) => child.classList.toggle("lost", index + 1 > count));
      const label = battleContentEl.querySelector(`[data-count-label="${role}"]`);
      if (label) label.textContent = `残存 ${count}/${max}`;
      if (count <= 0) battleContentEl.querySelector(`[data-battle-card="${role}"]`)?.classList.add("dimmed");
    }

    function drawBattleUnitGroup(drawCtx, unit, x, y, count, maxCount, side) {
      const gap = 14;
      for (let i = 0; i < maxCount; i++) {
        const px = x + (i % 5) * gap * (side === "left" ? 1 : -1);
        const py = y + Math.floor(i / 5) * 14;
        drawCtx.globalAlpha = i < count ? 1 : .25;
        drawMiniUnit(drawCtx, unit.type, px, py, 12, unit.team);
      }
      drawCtx.globalAlpha = 1;
    }

    function drawMiniUnit(drawCtx, type, x, y, size, team) {
      if (type === "infantry") drawMiniInfantry(drawCtx, x, y, size, team);
      else if (type === "tank") drawMiniTank(drawCtx, x, y, size, team);
      else if (type === "heavyTank") drawMiniHeavyTank(drawCtx, x, y, size, team);
      else if (type === "artillery") drawMiniArtillery(drawCtx, x, y, size, team);
      else if (type === "attackHeli") drawMiniHelicopter(drawCtx, x, y, size, team);
      else drawMiniAntiAir(drawCtx, x, y, size, team);
    }

    function drawMiniInfantry(drawCtx, x, y, size, team) { drawInfantrySprite(drawCtx, x, y, size * 1.8, team); }
    function drawMiniTank(drawCtx, x, y, size, team) { drawTankSprite(drawCtx, x, y, size * 2, team); }
    function drawMiniHeavyTank(drawCtx, x, y, size, team) { drawHeavyTankSprite(drawCtx, x, y, size * 2, team); }
    function drawMiniArtillery(drawCtx, x, y, size, team) { drawArtillerySprite(drawCtx, x, y, size * 2, team); }
    function drawMiniHelicopter(drawCtx, x, y, size, team) { drawHelicopterSprite(drawCtx, x, y, size * 2, team); }
    function drawMiniAntiAir(drawCtx, x, y, size, team) { drawAntiAirSprite(drawCtx, x, y, size * 2, team); }

    function predictCombat(attacker, defender, randomize = true) {
      const attackerBefore = unitCount(attacker);
      const defenderBefore = unitCount(defender);
      const strike = calculateStrikeDamage(attacker, defender, attackerBefore, defenderBefore, 1, randomize);
      const damage = strike.damage;
      const defenderAfter = Math.max(0, defenderBefore - damage);
      let counterDamage = 0;
      const countered = defenderAfter > 0 && canCounterAttack(defender, attacker);
      if (countered) {
        counterDamage = calculateStrikeDamage(defender, attacker, defenderAfter, attackerBefore, .72, randomize).damage;
      }
      return {
        attackerBefore,
        attackerAfter: Math.max(0, attackerBefore - counterDamage),
        defenderBefore,
        defenderAfter,
        attackDamage: damage,
        damageCount: damage,
        counterDamage,
        destroyed: defenderAfter <= 0,
        countered,
        hitChance: strike.hitChance,
        powerRatio: strike.powerRatio,
        counterBlockedReason: defenderAfter > 0 && defender.type === "artillery" ? "反撃できない" : ""
      };
    }

    function calculateStrikeDamage(attacker, defender, attackerCount, defenderCount, scale = 1, randomize = true) {
      const attackDef = unitStats(attacker);
      const defenseDef = unitStats(defender);
      const attackBase = unitMovementType(defender) === "air" && attackDef.airAttack ? attackDef.airAttack : attackDef.attack;
      const attackLevel = 1 + Math.max(0, (attacker.level || 1) - 1) * .05;
      const defenseLevel = 1 + Math.max(0, (defender.level || 1) - 1) * .05;
      const attackerPower = attackBase * (attackerCount / unitMaxCount(attacker)) * attackLevel * unitAffinity(attacker, defender);
      const defenderPower = defenseDef.defense * (defenderCount / unitMaxCount(defender)) * defenseLevel + terrainDefenseFor(defender);
      const powerRatio = attackerPower / Math.max(1, defenderPower);
      const ratioModifier = powerRatio < .5 ? .28 : powerRatio < .9 ? .68 : powerRatio < 1.2 ? 1 : powerRatio < 1.8 ? 1.32 : powerRatio < 2.5 ? 1.72 : 2.15;
      const numericalEdge = attackerCount / Math.max(1, defenderCount);
      let hitChance = Math.max(.18, Math.min(.97, .56 + (powerRatio - 1) * .14 + (numericalEdge - 1) * .035));
      const antiAirVsHeli = attacker.type === "antiAir" && defender.type === "attackHeli";
      if (antiAirVsHeli) hitChance = Math.min(hitChance, .68 + Math.min(.06, Math.max(0, (attacker.level || 1) - 1) * .02));
      let rawDamage = (attackerPower / 18) * ratioModifier * scale;
      if (randomize) {
        rawDamage *= .82 + Math.random() * .36;
        if (Math.random() > hitChance) rawDamage *= .35;
      }
      let damage = Math.max(0, Math.round(rawDamage));
      let cap = powerRatio >= 2.5 ? 10 : powerRatio >= 1.8 ? 7 : powerRatio >= 1.2 ? 6 : 5;
      if (antiAirVsHeli) cap = (attacker.level || 1) >= 3 && attackerCount >= 9 ? 6 : 5;
      damage = Math.min(defenderCount, cap, damage);
      if (powerRatio >= 2.5 && attackerCount >= 6 && defenderCount <= 2) damage = defenderCount;
      return { damage, hitChance, powerRatio, attackerPower, defenderPower };
    }

    function canCounterAttack(defender, attacker) {
      if (!defender || !canEverAttack(defender) || !canAttackTarget(defender, attacker)) return false;
      if (defender.type === "artillery") return false;
      return isTargetInAttackRange(defender, attacker);
    }

    function effectiveAttack(u) {
      const def = unitStats(u);
      const levelBonus = 1 + Math.max(0, (u.level || 1) - 1) * .05;
      return Math.round(def.attack * levelBonus * (unitCount(u) / unitMaxCount(u)));
    }

    function effectiveAttackAgainst(attacker, defender) {
      const def = unitStats(attacker);
      const base = unitMovementType(defender) === "air" && def.airAttack ? def.airAttack : def.attack;
      const levelBonus = 1 + Math.max(0, (attacker.level || 1) - 1) * .05;
      return Math.round(base * levelBonus * (unitCount(attacker) / unitMaxCount(attacker)));
    }

    function effectiveDefense(u) {
      const levelBonus = 1 + Math.max(0, (u.level || 1) - 1) * .05;
      return Math.round(unitStats(u).defense * levelBonus);
    }

    function terrainDefenseFor(u) {
      if (unitMovementType(u) === "air") return 0;
      return terrainDefs[state.map[u.y]?.[u.x]?.type]?.defense || 0;
    }

    function gainExperience(u, amount) {
      if (!u || !state.units.includes(u)) return;
      if (u.exp === undefined) u.exp = u.xp || 0;
      if (u.maxLevel === undefined) u.maxLevel = 5;
      u.exp += amount;
      u.xp = u.exp;
      let leveled = false;
      while ((u.level || 1) < u.maxLevel && u.exp >= 100 * (u.level || 1)) {
        u.exp -= 100 * (u.level || 1);
        u.xp = u.exp;
        u.level = (u.level || 1) + 1;
        leveled = true;
        addLog(`${unitLabel(u)}がレベル${u.level}になった。`);
      }
      if (leveled) {
        if (!state.levelEffects) state.levelEffects = [];
        state.levelEffects.push({ x: u.x, y: u.y, text: "LEVEL UP!", until: Date.now() + 1800, duration: 1800 });
        playLevelUpSound();
        showToast(`${unitName(u)} Lv${u.level}になった！`);
      }
    }

    function doCapture() {
      const u = getSelected();
      if (!canCapture(u)) return;
      captureUnit(u);
      checkVictory();
      selectUnit(u.id);
    }

    function captureUnit(u) {
      const cell = state.map[u.y][u.x];
      if (!isProperty(cell) || cell.owner === u.team) return;
      if (cell.captureInProgressBy && cell.captureInProgressBy !== u.team) {
        cell.captureDurability = cell.captureDurabilityMax || 10;
      }
      cell.captureInProgressBy = u.team;
      cell.captureTeam = u.team;
      const before = cell.captureDurability ?? 10;
      cell.captureDurability = Math.max(0, before - unitCount(u));
      markCaptured(u);
      addLog(`${unitLabel(u)}が${terrainDefs[cell.type].name}を占領中。耐久度 ${before}→${cell.captureDurability}`);
      if (cell.captureDurability <= 0) {
        cell.capturePendingOwner = u.team;
        playCaptureSound();
        gainExperience(u, 20);
        addLog(`${unitLabel(u)}が占領経験を得た。`);
        addLog(`${teamName[u.team]}が${terrainDefs[cell.type].name}を占領完了予定。`);
      }
    }

    function facilityRecoverUnit(u) {
      const cell = state.map[u.y][u.x];
      const terrain = terrainDefs[cell.type];
      if (!isProperty(cell) || cell.owner !== u.team || !terrain.repair) return;
      const old = { count: unitCount(u) };
      const reinforce = getRepairAmount(cell);
      setUnitCount(u, unitCount(u) + reinforce);
      if (unitCount(u) !== old.count) {
        addLog(`${unitLabel(u)}が${terrain.name}で補充を受け、${old.count}→${unitCount(u)}に回復しました。`);
      }
    }

    function getRepairAmount(facility) {
      return terrainDefs[facility?.type]?.repair?.count || 0;
    }

    async function endTurn() {
      if (state.gameOver || state.locked || state.active !== "blue") return;
      state.locked = true;
      lastMove = null;
      deployPendingProductions("blue");
      checkVictory();
      if (state.gameOver) return;
      clearSelection();
      startTurn("red");
      addLog("青軍ターン終了。赤軍が行動します。");
      render();
      await showTurnMessage("赤軍ターン開始", 950);
      turnMessageEl.textContent = "敵部隊が行動中";
      turnMessageEl.classList.add("show");
      await sleep(280);
      turnMessageEl.classList.remove("show");
      await cpuTurn();
    }

    async function processCpuActions(team) {
      if (state.gameOver) return;
      const actionState = state;
      cpuCaptureAssignments[team] = new Map();
      cpuDefenseAssignments[team] = new Map();
      for (const unit of state.units.filter(candidate => candidate.team === team)) unit.cpuTargetKey = null;
      const situation = evaluateStrategicSituation(team);
      addLog(`${teamName[team]}AI方針: ${strategicPhaseName(situation.phase)} / ${situation.shouldDefend ? "防衛優先" : situation.shouldExpandEconomy ? "経済拡張" : situation.shouldAttackHq ? "司令部攻略" : "戦力整備"}。`);
      const cpuUnits = state.units.filter(u => u.team === team).sort((a, b) => a.y - b.y || a.x - b.x);
      for (const u of cpuUnits) {
        if (state !== actionState || !state.units.includes(u) || state.gameOver) break;
        await maybeCenterCameraOnUnit(u, cpuDuration(560));
        await cpuSleep(100);
        if (state !== actionState) break;
        const objective = decideCpuAction(u, team, situation.profile, situation);
        const stationaryTarget = !canAttackAfterMove(u) ? bestAttackTarget(u, objective) : null;
        if (objective && canMove(u) && !stationaryTarget) {
          const move = bestCpuMove(u, objective);
          if (move) await animateCpuMove(u, move);
        }
        if (canCapture(u)) {
          state.animatingId = u.id;
          captureUnit(u);
          render();
          await cpuSleep(280);
        }
        const enemy = shouldCpuAttack(u, objective) ? (stationaryTarget || bestAttackTarget(u, objective)) : null;
        if (!enemy && u.type === "infantry" && objective?.kind?.startsWith("capture") && getAttackableCells(u).size) {
          addLog(`${unitLabel(u)}は戦闘を避け、${objective.label}へ向かいます。`);
        }
        if (enemy && canAttack(u)) {
          await maybeCenterCameraBetweenUnits(u, enemy, cpuDuration(560));
          state.animatingId = u.id;
          addLog(`${unitLabel(u)}が攻撃準備。`);
          render();
          await cpuSleep(300);
          await attack(u, enemy);
          markAttacked(u);
          render();
          await cpuSleep(360);
        }
        checkVictory();
      }
      state.animatingId = null;
    }

    async function cpuTurn() {
      await processCpuActions("red");
      if (!state.gameOver) {
        cpuProduce("red");
        deployPendingProductions("red");
        checkVictory();
        if (state.gameOver) return;
        state.turn += 1;
        await showTurnMessage("敵ターン終了", 850);
        startTurn("blue");
        addLog(`青軍ターン ${state.turn} 開始。`);
        await showTurnMessage("青軍ターン開始", 1050);
      }
      state.locked = false;
      clearSelection();
      render();
    }

    async function runWatchLoop() {
      if (watchLoopRunning || state.gameMode !== "cpuVsCpu" || state.gameOver) return;
      watchLoopRunning = true;
      const session = watchSession;
      while (session === watchSession && state.gameMode === "cpuVsCpu" && !state.gameOver) {
        if (watchPaused) {
          await sleep(100);
          continue;
        }
        const stepping = watchStepRequested || watchStopAfterTeam === state.active;
        const team = state.active;
        state.locked = true;
        clearSelection();
        addLog(`${teamName[team]}CPU ターン開始。`);
        render();
        await processCpuActions(team);
        if (state.gameOver || session !== watchSession) break;
        cpuProduce(team);
        deployPendingProductions(team);
        checkVictory();
        if (state.gameOver) break;
        if (team === "red") state.turn += 1;
        const nextTeam = oppositeTeam(team);
        startTurn(nextTeam);
        addLog(`${teamName[nextTeam]}CPU ターン ${state.turn}。`);
        if (stepping) {
          watchStepRequested = false;
          watchStopAfterTeam = null;
          watchPaused = true;
          addLog("観戦を1ターン進め、一時停止しました。");
        }
        state.locked = false;
        render();
        await cpuSleep(420);
      }
      watchLoopRunning = false;
      if (state?.gameMode === "cpuVsCpu" && !state.gameOver) {
        state.locked = false;
        render();
      }
    }

    function pauseWatch() {
      if (state.gameMode !== "cpuVsCpu") return;
      watchPaused = true;
      watchStepRequested = false;
      watchStopAfterTeam = null;
      render();
    }

    function resumeWatch() {
      if (state.gameMode !== "cpuVsCpu" || state.gameOver) return;
      watchPaused = false;
      watchStepRequested = false;
      watchStopAfterTeam = null;
      render();
      runWatchLoop();
    }

    function stepWatchTurn() {
      if (state.gameMode !== "cpuVsCpu" || state.gameOver || state.locked) return;
      watchStepRequested = true;
      watchStopAfterTeam = state.active;
      watchPaused = false;
      addLog(`${teamName[state.active]}CPUの1ターン進行を開始。`);
      render();
      runWatchLoop();
    }

    async function animateCpuMove(u, move) {
      state.animatingId = u.id;
      addLog(`${unitLabel(u)}が移動開始。`);
      for (const step of move.path) {
        if (!state.units.includes(u)) break;
        playUnitMoveSound(u);
        u.x = step.x;
        u.y = step.y;
        if (!isHexVisibleOnScreen(u.y, u.x, 54)) {
          const world = hexToWorld(u.y, u.x);
          mapOffsetX += (canvasCssWidth / 2 - (mapOffsetX + world.x * zoomScale)) * .16;
          mapOffsetY += (canvasCssHeight / 2 - (mapOffsetY + world.y * zoomScale)) * .16;
          clampPan();
        }
        render();
        await cpuSleep(210);
      }
      markMoved(u);
      addLog(`${unitLabel(u)}が移動。`);
      render();
      await cpuSleep(180);
    }

    function watchSpeedFactor() {
      if (state?.gameMode !== "cpuVsCpu") return 1;
      return watchSpeed === "slow" ? 1.45 : watchSpeed === "fast" ? .58 : watchSpeed === "ultra" ? .22 : 1;
    }

    function cpuDuration(ms) {
      return Math.max(80, Math.round(ms * watchSpeedFactor()));
    }

    function cpuSleep(ms) {
      return sleep(Math.max(20, Math.round(ms * watchSpeedFactor())));
    }

    function startTurn(team) {
      applyPendingCaptures();
      checkVictory();
      if (state.gameOver) return;
      state.active = team;
      collectIncome(team);
      for (const u of state.units.filter(unit => unit.team === team)) {
        u.moved = false;
        u.attacked = false;
        u.captured = false;
        u.hasMoved = false;
        u.hasAttacked = false;
        u.hasCaptured = false;
        u.hasActed = false;
        facilityRecoverUnit(u);
      }
    }

    function applyPendingCaptures() {
      for (const cell of state.map.flat()) {
        if (!isProperty(cell) || !cell.capturePendingOwner) continue;
        const previousOwner = cell.owner;
        cell.owner = cell.capturePendingOwner;
        addLog(`${teamName[cell.owner]}が${terrainDefs[cell.type].name}を占領した。`);
        if (previousOwner !== "neutral" && previousOwner !== cell.owner) {
          addLog(`${teamName[previousOwner]}は${terrainDefs[cell.type].name}を失い、収入が${facilityIncome(cell.type)}減少。`);
        }
        addLog(`${teamName[cell.owner]}の次ターン収入が${facilityIncome(cell.type)}増加。`);
        cell.capturePendingOwner = null;
        cell.captureInProgressBy = null;
        cell.captureTeam = null;
        cell.capture = 0;
        cell.captureDurabilityMax = cell.captureDurabilityMax || 10;
        cell.captureDurability = cell.captureDurabilityMax;
      }
    }

    function bestCpuMove(u, target) {
      if (!target || (u.x === target.x && u.y === target.y)) return null;
      const enemyAntiAir = state.units.filter(other => other.team !== u.team && other.type === "antiAir");
      const routeDistances = buildCpuDistanceField(u, target);
      const currentRoute = cpuRouteDistance(u, u.x, u.y, target, routeDistances);
      const moves = [...getReachable(u).entries()].map(([k, info]) => {
        const [x, y] = k.split(",").map(Number);
        const aaDistance = enemyAntiAir.length ? Math.min(...enemyAntiAir.map(enemy => hexDistance(x, y, enemy.x, enemy.y))) : 99;
        let risk = 0;
        if (u.type === "attackHeli" && aaDistance <= 4) risk += aaDistance >= 2 ? (5 - aaDistance) * 220 : 80;
        if (u.type === "infantry") risk += infantryMoveRisk(u, x, y, target);
        if ((u.type === "artillery" || u.type === "antiAir") && info.zocStop) risk += 900;
        if ((u.type === "tank" || u.type === "heavyTank") && info.zocStop && !hasFriendlyCombatSupport(u.team, x, y, 2, u.id)) risk += 220;
        return {
          x,
          y,
          cost: info.cost,
          path: info.path,
          d: hexDistance(x, y, target.x, target.y),
          route: cpuRouteDistance(u, x, y, target, routeDistances),
          risk,
          zocStop: !!info.zocStop
        };
      });
      if (!moves.length) return null;
      if (u.type === "infantry") {
        const currentRisk = infantryMoveRisk(u, u.x, u.y, target);
        const safeMoves = moves.filter(move => move.risk < 500);
        if (!safeMoves.length && currentRisk <= Math.min(...moves.map(move => move.risk))) {
          addLog(`${unitLabel(u)}は敵主力を避け、護衛を待って待機します。`);
          return null;
        }
      }
      if (u.type === "artillery" && target.team && target.team !== u.team) {
        const def = unitStats(u);
        const desiredRange = def.range;
        const score = move => Math.abs(desiredRange - move.d) * 8 + (move.d < (def.minRange || 1) ? 20 : 0) + move.risk;
        moves.sort((a, b) => score(a) - score(b) || a.route - b.route || a.cost - b.cost);
        if (Math.abs(desiredRange - hexDistance(u.x, u.y, target.x, target.y)) === 0 && score(moves[0]) >= 0) return null;
      } else {
        moves.sort((a, b) => (a.route + a.risk) - (b.route + b.risk) || a.d - b.d || b.cost - a.cost);
        if (moves[0].route >= currentRoute && target.kind === "retreat") return null;
      }
      return moves[0];
    }

    function infantryMoveRisk(u, x, y, target = null) {
      const enemies = state.units.filter(enemy => enemy.team !== u.team);
      const adjacentEnemy = enemies.some(enemy => hexDistance(x, y, enemy.x, enemy.y) === 1);
      const dangerousEnemies = enemies.filter(enemy =>
        (enemy.type === "tank" || enemy.type === "heavyTank" || enemy.type === "attackHeli") && hexDistance(x, y, enemy.x, enemy.y) <= 2
      );
      const artilleryThreat = enemies.some(enemy => enemy.type === "artillery" && hexDistance(x, y, enemy.x, enemy.y) >= getMinAttackRange(enemy) && hexDistance(x, y, enemy.x, enemy.y) <= unitStats(enemy).range);
      const nextTurnThreats = enemies.filter(enemy => canThreatenHexNextTurn(enemy, x, y)).length;
      const escorted = hasFriendlyCombatSupport(u.team, x, y, 2, u.id);
      let risk = adjacentEnemy ? 800 : 0;
      risk += dangerousEnemies.length * 500;
      if (artilleryThreat) risk += 450;
      risk += Math.min(600, nextTurnThreats * 180);
      if (escorted) risk -= 260;
      if (target && x === target.x && y === target.y && isProperty(state.map[y][x])) risk -= 300;
      return Math.max(0, risk);
    }

    function hasFriendlyCombatSupport(team, x, y, radius = 2, excludeId = null) {
      return state.units.some(ally =>
        ally.team === team && ally.id !== excludeId && unitCount(ally) > 0 && (ally.type === "tank" || ally.type === "heavyTank") && hexDistance(x, y, ally.x, ally.y) <= radius
      );
    }

    function canThreatenHexNextTurn(enemy, x, y) {
      if (!canEverAttack(enemy)) return false;
      if (enemy.type === "antiAir") return false;
      const def = unitStats(enemy);
      const distance = hexDistance(enemy.x, enemy.y, x, y);
      const moveAllowance = canAttackAfterMove(enemy) ? def.move : 0;
      return distance <= moveAllowance + def.range && distance >= Math.max(1, getMinAttackRange(enemy) - moveAllowance);
    }

    function strategicPhaseName(phase) {
      return phase === "early" ? "序盤・占領重視" : phase === "mid" ? "中盤・経済争奪" : "終盤・攻勢";
    }

    function calculateTeamCombatPower(team) {
      return state.units.filter(u => u.team === team).reduce((total, u) => {
        const def = unitStats(u);
        const attack = Math.max(def.attack || 0, (def.airAttack || 0) * .85);
        const roleWeight = u.type === "infantry" ? .82 : u.type === "artillery" ? 1.08 : u.type === "heavyTank" ? 1.18 : 1;
        return total + (attack + def.defense * .72 + def.move * 2) * (unitCount(u) / unitMaxCount(u)) * roleWeight;
      }, 0);
    }

    function evaluateStrategicSituation(team) {
      const profile = getAiProfile(team);
      const enemyTeam = oppositeTeam(team);
      const ownUnits = state.units.filter(u => u.team === team);
      const enemyUnits = state.units.filter(u => u.team === enemyTeam);
      const ownPower = calculateTeamCombatPower(team);
      const enemyPower = calculateTeamCombatPower(enemyTeam);
      const ownIncome = calculateIncome(team);
      const enemyIncome = calculateIncome(enemyTeam);
      const ownFacilities = state.map.flat().filter(cell => isProperty(cell) && cell.owner === team).length;
      const enemyFacilities = state.map.flat().filter(cell => isProperty(cell) && cell.owner === enemyTeam).length;
      const neutralFacilities = state.map.flat().filter(cell => isProperty(cell) && cell.owner === "neutral");
      const hqDanger = assessHeadquartersDanger(team);
      const ownDamagedUnits = ownUnits.filter(u => unitCount(u) <= 5).length;
      let phase = state.turn <= 6 ? "early" : state.turn <= 15 ? "mid" : "late";
      if (state.turn >= 8 && ownPower >= enemyPower * 1.4 && ownIncome >= enemyIncome) phase = "late";
      const threatenedFacility = findThreatenedFriendlyFacility(team);
      const situation = {
        team, enemyTeam, ownUnits, enemyUnits, ownPower, enemyPower, ownIncome, enemyIncome,
        ownFacilities, enemyFacilities, neutralFacilities, ownDamagedUnits, hqDanger,
        threatenedFacility, phase, profile,
        shouldExpandEconomy: neutralFacilities.length > 0 && (profile.economyFocus >= 1.2 || phase === "early" || ownIncome <= enemyIncome || ownFacilities <= enemyFacilities),
        shouldDefend: (hqDanger.isDangerous || !!threatenedFacility) && profile.defenseFocus >= .75,
        shouldAttackHq: false
      };
      situation.shouldAttackHq = shouldAttackEnemyHq(team, situation);
      return situation;
    }

    function shouldAttackEnemyHq(team, situation = null) {
      const info = situation || evaluateStrategicSituation(team);
      const enemyHq = findHeadquarters(info.enemyTeam);
      if (!enemyHq || info.hqDanger.isDangerous) return false;
      const healthyInfantry = info.ownUnits.filter(u => u.type === "infantry" && unitCount(u) >= 6);
      if (!healthyInfantry.length) return false;
      const escorted = healthyInfantry.some(infantry => info.ownUnits.some(escort =>
        (escort.type === "tank" || escort.type === "heavyTank") && unitCount(escort) >= 6 && hexDistance(infantry.x, infantry.y, escort.x, escort.y) <= 3
      ));
      if (!escorted) return false;
      const enemyPowerNearHq = info.enemyUnits
        .filter(enemy => hexDistance(enemy.x, enemy.y, enemyHq.x, enemyHq.y) <= 4)
        .reduce((total, enemy) => total + unitPowerValue(enemy), 0);
      const profile = info.profile || getAiProfile(team);
      if (info.ownIncome < info.enemyIncome * (.8 / profile.aggression) || info.ownFacilities < (profile.aggression >= 1.2 ? 2 : 3)) return false;
      if (info.ownPower < Math.max(1, enemyPowerNearHq) * (1.25 / profile.aggression)) return false;
      return info.phase === "late" || (state.turn >= Math.round(8 / profile.aggression) && info.ownPower >= info.enemyPower * (1.35 / profile.aggression));
    }

    function unitPowerValue(u) {
      const def = unitStats(u);
      return (Math.max(def.attack || 0, def.airAttack || 0) + def.defense * .7) * (unitCount(u) / unitMaxCount(u));
    }

    function findThreatenedFriendlyFacility(team) {
      const profile = getAiProfile(team);
      const enemies = state.units.filter(u => u.team !== team);
      return state.map.flat()
        .filter(cell => isProperty(cell) && cell.owner === team)
        .map(cell => {
          const threats = enemies.filter(enemy => {
            const limit = unitMovementType(enemy) === "air" ? 4 : 3;
            return hexDistance(enemy.x, enemy.y, cell.x, cell.y) <= limit;
          });
          const defenders = state.units.filter(ally => ally.team === team && ally.type !== "infantry" && hexDistance(ally.x, ally.y, cell.x, cell.y) <= 2).length;
          const value = cell.type === "hq" ? 500 : cell.type === "factory" ? 320 : 180;
          const score = (value + threats.reduce((sum, enemy) => sum + (enemy.type === "infantry" ? 180 : enemy.type === "heavyTank" ? 170 : enemy.type === "tank" ? 140 : 100), 0) - defenders * 90) * profile.defenseFocus + profile.defenseWeight * .15;
          return { cell, threats, score };
        })
        .filter(item => item.threats.length && item.score > 180)
        .sort((a, b) => b.score - a.score)[0] || null;
    }

    function chooseCpuObjective(u, situation = evaluateStrategicSituation(u.team)) {
      const enemyHq = findHeadquarters(oppositeTeam(u.team));
      if (u.type === "infantry" && situation.shouldAttackHq && enemyHq && canReachThisTurn(u, enemyHq)) {
        return cpuObjective("enemyHq", enemyHq, "敵司令部占領");
      }

      const hqThreat = headquartersThreat(u.team);
      if (hqThreat && unitCount(u) > 4 && u.type !== "attackHeli") {
        return cpuObjective("defendHq", hqThreat, "司令部防衛");
      }

      const facilityDefense = defenseObjectiveForUnit(u, situation);
      if (facilityDefense) return facilityDefense;

      if (shouldRetreatCpuUnit(u, situation)) {
        const safe = nearestFriendlyRecoveryProperty(u, 5);
        if (safe) {
          addLog(`${unitLabel(u)}は損傷したため${terrainDefs[safe.type].name}へ後退します。`);
          return cpuObjective("retreat", safe, "補充後退");
        }
      }

      if (u.type === "antiAir") {
        const airTarget = bestEnemyForRole(u);
        if (airTarget) return cpuObjective("interceptAir", airTarget, "敵航空部隊迎撃");
        const anchor = airDefenseAnchor(u);
        return anchor ? cpuObjective("airDefense", anchor, "主力防空待機") : null;
      }

      if (u.type === "infantry") {
        const targetProperty = bestStrategicProperty(u, situation);
        if (targetProperty) {
          assignCpuCaptureTarget(u, targetProperty);
          const kind = targetProperty.owner === "neutral" ? "captureNeutral" : "captureEnemy";
          addLog(`${unitLabel(u)}は${targetProperty.owner === "neutral" ? "未占領の中立" : "敵"}${terrainDefs[targetProperty.type].name}(${targetProperty.x},${targetProperty.y})へ向かいます。`);
          return cpuObjective(kind, targetProperty, targetProperty.owner === "neutral" ? "中立施設占領" : "敵施設占領");
        }
        const escort = nearestEscortAnchor(u);
        if (escort) return cpuObjective("holdWithEscort", escort, "主力合流");
        return null;
      }

      if ((situation.phase === "early" || situation.shouldExpandEconomy) && (u.type === "tank" || u.type === "heavyTank" || u.type === "artillery" || u.type === "attackHeli")) {
        const infantry = nearestCaptureInfantry(u);
        if (infantry) return cpuObjective("escortCapture", infantry, "占領部隊護衛");
      }

      if (["tank", "heavyTank"].includes(u.type) && !hasReachedCentralRiver(u)) {
        const bridge = bestStrategicBridge(u);
        if (bridge) return cpuObjective("secureBridge", bridge, "橋頭堡確保");
      }

      if (u.type === "artillery") {
        const target = bestEnemyForRole(u);
        if (target) return cpuObjective("artillerySupport", target, "後方砲撃");
      }

      if ((u.type === "tank" || u.type === "heavyTank") && enemyHq && situation.shouldAttackHq) {
        return cpuObjective("advanceHq", enemyHq, "敵司令部方面へ前進");
      }
      const frontTarget = bestEnemyForRole(u) || nearestEnemy(u);
      return frontTarget ? cpuObjective("advance", frontTarget, "前線前進") : enemyHq ? cpuObjective("advanceHq", enemyHq, "敵司令部方面へ前進") : null;
    }

    function decideCpuAction(unitToMove, team = unitToMove.team, profile = getAiProfile(team), situation = evaluateStrategicSituation(team)) {
      situation.profile = profile;
      return chooseCpuObjective(unitToMove, situation);
    }

    function defenseObjectiveForUnit(u, situation) {
      const defense = situation.threatenedFacility;
      if (!defense) return null;
      const assignments = cpuDefenseAssignments[u.team] || new Map();
      const defenseKey = facilityKey(defense.cell);
      const assigned = assignments.get(defenseKey) || 0;
      const profile = situation.profile || getAiProfile(u.team);
      const defenderLimit = (defense.cell.type === "hq" ? 3 : 2) + (profile.defenseFocus >= 1.4 ? 1 : 0);
      if (assigned >= defenderLimit) return null;
      if (u.type === "attackHeli" && situation.phase === "early" && defense.cell.type !== "hq") return null;
      if (u.type === "antiAir" && !defense.threats.some(enemy => unitMovementType(enemy) === "air")) return null;
      if (u.type === "infantry" && defense.cell.type !== "hq" && hexDistance(u.x, u.y, defense.cell.x, defense.cell.y) > 5) return null;
      if (hexDistance(u.x, u.y, defense.cell.x, defense.cell.y) > (u.type === "artillery" ? 7 : 6)) return null;
      assignments.set(defenseKey, assigned + 1);
      cpuDefenseAssignments[u.team] = assignments;
      addLog(`${teamName[u.team]}は${terrainDefs[defense.cell.type].name}防衛のため${unitName(u)}を向かわせます。`);
      return cpuObjective("defendFacility", defense.cell, `${terrainDefs[defense.cell.type].name}防衛`);
    }

    function shouldRetreatCpuUnit(u, situation) {
      const profile = situation.profile || getAiProfile(u.team);
      const retreatThreshold = profile.repairWeight >= 650 ? 6 : profile.repairWeight <= 400 ? 4 : 5;
      if (unitCount(u) > retreatThreshold) return false;
      const recovery = nearestFriendlyRecoveryProperty(u, 5);
      if (!recovery) return false;
      const current = state.map[u.y][u.x];
      if (isProperty(current) && current.owner === u.team) return true;
      if (u.type === "infantry" && situation.shouldAttackHq) {
        const enemyHq = findHeadquarters(situation.enemyTeam);
        if (enemyHq && canReachThisTurn(u, enemyHq)) return false;
      }
      const hq = findHeadquarters(u.team);
      if (situation.hqDanger.isDangerous && hq && hexDistance(u.x, u.y, hq.x, hq.y) <= 4) return false;
      const decisiveTarget = bestAttackTarget(u);
      if (decisiveTarget) {
        const result = predictCombat(u, decisiveTarget, false);
        if (result.defenderAfter <= 0 && (decisiveTarget.type === "artillery" || decisiveTarget.type === "attackHeli" || isThreateningCriticalFacility(decisiveTarget, u.team))) return false;
      }
      return unitCount(u) <= Math.max(2, retreatThreshold - 2) || situation.ownPower <= situation.enemyPower * (1.05 + profile.defenseFocus * .1) || situation.phase !== "late";
    }

    function nearestFriendlyRecoveryProperty(u, maxDistance = 5) {
      return state.map.flat()
        .filter(cell => isProperty(cell) && cell.owner === u.team && (!unitAt(cell.x, cell.y) || (u.x === cell.x && u.y === cell.y)))
        .map(cell => {
          const field = buildCpuDistanceField(u, cell);
          const route = cpuRouteDistance(u, u.x, u.y, cell, field);
          return { cell, route };
        })
        .filter(item => Number.isFinite(item.route) && item.route <= maxDistance)
        .sort((a, b) => a.route - b.route || (a.cell.type === "hq" ? -1 : 0) - (b.cell.type === "hq" ? -1 : 0))[0]?.cell || null;
    }

    function assignCpuCaptureTarget(u, cell) {
      const assignments = cpuCaptureAssignments[u.team] || new Map();
      const targetKey = facilityKey(cell);
      const previous = assignments.get(targetKey) || 0;
      assignments.set(targetKey, previous + 1);
      cpuCaptureAssignments[u.team] = assignments;
      u.cpuTargetKey = targetKey;
      if (previous > 0) addLog(`${unitLabel(u)}は占領目標の重複を避け、別候補も比較しました。`);
    }

    function nearestCaptureInfantry(u) {
      return state.units
        .filter(ally => ally.team === u.team && ally.type === "infantry" && unitCount(ally) >= 6 && ally.cpuTargetKey)
        .sort((a, b) => hexDistance(u.x, u.y, a.x, a.y) - hexDistance(u.x, u.y, b.x, b.y))[0] || null;
    }

    function nearestEscortAnchor(u) {
      return state.units
        .filter(ally => ally.team === u.team && ally.id !== u.id && unitCount(ally) >= 6 && (ally.type === "tank" || ally.type === "heavyTank"))
        .sort((a, b) => hexDistance(u.x, u.y, a.x, a.y) - hexDistance(u.x, u.y, b.x, b.y))[0] || null;
    }

    function cpuObjective(kind, target, label) {
      return target ? { ...target, kind, label } : null;
    }

    function oppositeTeam(team) {
      return team === "red" ? "blue" : "red";
    }

    function findHeadquarters(team) {
      return state.map.flat().find(cell => cell.type === "hq" && cell.owner === team);
    }

    function canReachThisTurn(u, target) {
      return (u.x === target.x && u.y === target.y) || getReachable(u).has(key(target.x, target.y));
    }

    function headquartersThreat(team) {
      const hq = findHeadquarters(team);
      if (!hq) return null;
      return state.units
        .filter(enemy => enemy.team !== team)
        .map(enemy => ({ enemy, distance: hexDistance(enemy.x, enemy.y, hq.x, hq.y) }))
        .filter(item => item.distance <= 4)
        .sort((a, b) => a.distance - b.distance || unitCount(a.enemy) - unitCount(b.enemy))[0]?.enemy || null;
    }

    function nearestNeutralProperty(u) {
      const situation = evaluateStrategicSituation(u.team);
      return state.map.flat()
        .filter(cell => isProperty(cell) && cell.owner === "neutral")
        .sort((a, b) => evaluateFacilityTarget(u, b, u.team, situation.profile, situation) - evaluateFacilityTarget(u, a, u.team, situation.profile, situation))[0];
    }

    function bestStrategicProperty(u, situation = evaluateStrategicSituation(u.team)) {
      let candidates = state.map.flat()
        .filter(cell => isProperty(cell) && cell.owner !== u.team)
        .filter(cell => cell.type !== "hq" || situation.shouldAttackHq)
        .map(cell => ({ cell, score: evaluateFacilityTarget(u, cell, u.team, situation.profile, situation) }))
        .filter(item => Number.isFinite(item.score))
        .sort((a, b) => b.score - a.score);
      const neutralCandidates = candidates.filter(item => item.cell.owner === "neutral");
      if (situation.phase === "early" && neutralCandidates.length) candidates = neutralCandidates;
      return candidates[0]?.cell || null;
    }

    function cpuPropertyScore(u, cell) {
      return -evaluateEconomicTarget(cell, u, evaluateStrategicSituation(u.team));
    }

    function evaluateFacilityTarget(u, cell, team = u.team, profile = getAiProfile(team), situation = evaluateStrategicSituation(team)) {
      return evaluateEconomicTarget(cell, u, situation, profile);
    }

    function evaluateEconomicTarget(cell, u, situation, profile = situation?.profile || getAiProfile(u.team)) {
      const route = cpuRouteDistance(u, u.x, u.y, cell, buildCpuDistanceField(u, cell));
      if (!Number.isFinite(route)) return -Infinity;
      const ownHq = findHeadquarters(u.team);
      const enemyHq = findHeadquarters(situation.enemyTeam);
      const ownHqDistance = ownHq ? hexDistance(ownHq.x, ownHq.y, cell.x, cell.y) : 12;
      const enemyHqDistance = enemyHq ? hexDistance(enemyHq.x, enemyHq.y, cell.x, cell.y) : 12;
      const assignments = cpuCaptureAssignments[u.team] || new Map();
      const assigned = assignments.get(facilityKey(cell)) || 0;
      const nearbyEnemyArmor = situation.enemyUnits.filter(enemy =>
        (enemy.type === "tank" || enemy.type === "heavyTank") && hexDistance(enemy.x, enemy.y, cell.x, cell.y) <= 3
      ).length;
      let score = cell.type === "factory" ? profile.factoryWeight : cell.type === "hq" ? profile.enemyHqWeight : cell.owner === "neutral" ? profile.neutralCityWeight : profile.enemyCityWeight;
      score -= route * 20;
      if (cell.owner === "neutral") {
        score += 280 * profile.economyFocus;
        score -= ownHqDistance * 8;
        if (situation.phase === "early") score += 220;
      } else {
        score += situation.phase === "early" ? -650 : situation.phase === "mid" ? 180 : 300;
        if (situation.shouldExpandEconomy && situation.neutralFacilities.length) score -= 280;
      }
      if (cell.type === "factory") score += 150 * profile.economyFocus;
      if (ownHqDistance <= enemyHqDistance) score += 120;
      if (enemyHqDistance <= 4 && situation.phase !== "late") score -= 180;
      if (isOnStrategicRoute(ownHq, cell, enemyHq)) score += 80;
      score -= assigned * 250;
      score -= nearbyEnemyArmor * 200 * profile.defenseFocus;
      return score;
    }

    function isOnStrategicRoute(start, cell, goal) {
      if (!start || !goal) return false;
      const direct = hexDistance(start.x, start.y, goal.x, goal.y);
      const via = hexDistance(start.x, start.y, cell.x, cell.y) + hexDistance(cell.x, cell.y, goal.x, goal.y);
      return via - direct <= 3;
    }

    function hasReachedCentralRiver(u) {
      const crossingRows = state.map
        .map(row => row.filter(cell => cell.type === "river" || cell.type === "bridge"))
        .flat()
        .filter(cell => cell.x === u.x)
        .map(cell => cell.y);
      const riverY = crossingRows.length ? crossingRows.reduce((sum, y) => sum + y, 0) / crossingRows.length : 7;
      return u.team === "red" ? u.y <= riverY : u.y >= riverY;
    }

    function bestStrategicBridge(u) {
      const bridges = state.map.flat().filter(cell => cell.type === "bridge");
      const enemyHq = findHeadquarters(oppositeTeam(u.team));
      return bridges
        .map(bridge => {
          const field = buildCpuDistanceField(u, bridge);
          const route = cpuRouteDistance(u, u.x, u.y, bridge, field);
          const enemyPressure = state.units
            .filter(enemy => enemy.team !== u.team)
            .reduce((score, enemy) => score + (hexDistance(enemy.x, enemy.y, bridge.x, bridge.y) <= 3 ? 2 : 0), 0);
          return { bridge, score: route - enemyPressure + (enemyHq ? hexDistance(bridge.x, bridge.y, enemyHq.x, enemyHq.y) * .15 : 0) };
        })
        .filter(item => Number.isFinite(item.score))
        .sort((a, b) => a.score - b.score)[0]?.bridge || null;
    }

    function buildCpuDistanceField(u, target) {
      if (unitMovementType(u) === "air") return null;
      const distances = new Map([[key(target.x, target.y), 0]]);
      const queue = [{ x: target.x, y: target.y, cost: 0 }];
      while (queue.length) {
        queue.sort((a, b) => a.cost - b.cost);
        const current = queue.shift();
        if (current.cost !== distances.get(key(current.x, current.y))) continue;
        for (const [nx, ny] of hexNeighbors(current.x, current.y)) {
          const occupant = unitAt(nx, ny);
          if (occupant && occupant.id !== u.id) continue;
          if (!canEnterTerrain(u, nx, ny)) continue;
          const step = terrainDefs[state.map[ny][nx].type].move;
          const nextCost = current.cost + step;
          const nextKey = key(nx, ny);
          if (nextCost < (distances.get(nextKey) ?? Infinity)) {
            distances.set(nextKey, nextCost);
            queue.push({ x: nx, y: ny, cost: nextCost });
          }
        }
      }
      return distances;
    }

    function cpuRouteDistance(u, x, y, target, field) {
      if (unitMovementType(u) === "air") return hexDistance(x, y, target.x, target.y);
      return field?.get(key(x, y)) ?? Infinity;
    }

    function shouldCpuAttack(u, objective) {
      if (!objective || objective.kind !== "retreat") return true;
      const cell = state.map[u.y][u.x];
      return isProperty(cell) && cell.owner === u.team;
    }

    function nearestFriendlyProperty(u) {
      return state.map.flat()
        .filter(cell => isProperty(cell) && cell.owner === u.team)
        .sort((a, b) => hexDistance(u.x, u.y, a.x, a.y) - hexDistance(u.x, u.y, b.x, b.y))[0];
    }

    function nearestCapturableProperty(u) {
      return state.map.flat()
        .filter(cell => isProperty(cell) && cell.owner !== u.team)
        .sort((a, b) => {
          const aScore = cpuPropertyScore(u, a);
          const bScore = cpuPropertyScore(u, b);
          return aScore - bScore;
        })[0];
    }

    function bestEnemyForRole(u) {
      const enemies = state.units.filter(other => other.team !== u.team);
      if (u.type === "antiAir") {
        return enemies
          .filter(enemy => unitMovementType(enemy) === "air")
          .sort((a, b) => cpuAntiAirTargetScore(u, b) - cpuAntiAirTargetScore(u, a) || hexDistance(u.x, u.y, a.x, a.y) - hexDistance(u.x, u.y, b.x, b.y))[0];
      }
      if (u.type === "attackHeli") {
        const priority = { artillery: 0, infantry: 1, tank: 2, heavyTank: 3, attackHeli: 4, antiAir: 9 };
        return enemies.sort((a, b) => (priority[a.type] ?? 6) - (priority[b.type] ?? 6) || hexDistance(u.x, u.y, a.x, a.y) - hexDistance(u.x, u.y, b.x, b.y))[0];
      }
      const priority = { heavyTank: 0, tank: 1, artillery: 2, infantry: 3 };
      if (u.type === "tank" || u.type === "heavyTank") {
        return enemies.sort((a, b) => (priority[a.type] ?? 9) - (priority[b.type] ?? 9) || hexDistance(u.x, u.y, a.x, a.y) - hexDistance(u.x, u.y, b.x, b.y))[0];
      }
      if (u.type === "artillery") {
        const priority = { heavyTank: 0, tank: 1, antiAir: 2, infantry: 3, artillery: 4, attackHeli: 8 };
        return enemies
          .filter(enemy => canAttackTarget(u, enemy))
          .sort((a, b) => (priority[a.type] ?? 6) - (priority[b.type] ?? 6) || hexDistance(u.x, u.y, a.x, a.y) - hexDistance(u.x, u.y, b.x, b.y))[0];
      }
      return enemies.sort((a, b) => hexDistance(u.x, u.y, a.x, a.y) - hexDistance(u.x, u.y, b.x, b.y))[0];
    }

    function bestAttackTarget(u, objective = null) {
      const targets = state.units.filter(other => other.team !== u.team).filter(other => {
        return isTargetInAttackRange(u, other);
      });
      if (u.type === "antiAir") {
        return targets.sort((a, b) => cpuAntiAirTargetScore(u, b) - cpuAntiAirTargetScore(u, a))[0];
      }
      if (u.type === "infantry") {
        const acceptable = targets.filter(target => infantryMayAttack(u, target, objective));
        return acceptable.sort((a, b) => infantryAttackScore(u, b, objective) - infantryAttackScore(u, a, objective))[0];
      }
      if (u.type === "attackHeli") {
        const priority = { artillery: 0, infantry: 1, tank: 2, heavyTank: 3, attackHeli: 4, antiAir: 9 };
        return targets.sort((a, b) => (priority[a.type] ?? 6) - (priority[b.type] ?? 6) || evaluateAttackTarget(u, b) - evaluateAttackTarget(u, a))[0];
      }
      if (u.type === "tank" || u.type === "heavyTank") {
        const priority = { heavyTank: 0, tank: 1, artillery: 2, infantry: 3 };
        return targets.sort((a, b) => (priority[a.type] ?? 9) - (priority[b.type] ?? 9) || evaluateAttackTarget(u, b) - evaluateAttackTarget(u, a))[0];
      }
      return targets.sort((a, b) => evaluateAttackTarget(u, b) - evaluateAttackTarget(u, a))[0];
    }

    function evaluateAttackTarget(attacker, enemy, team = attacker.team, profile = getAiProfile(team)) {
      const estimate = predictCombat(attacker, enemy, false);
      let score = estimate.attackDamage * 110 * profile.aggression - estimate.counterDamage * 80 * profile.defenseFocus;
      if (estimate.defenderAfter <= 0) score += 420 * profile.aggression;
      if (isThreateningCriticalFacility(enemy, team)) score += profile.defenseWeight * .55;
      if (enemy.type === "infantry" && state.map[enemy.y]?.[enemy.x] && isProperty(state.map[enemy.y][enemy.x])) score += 160;
      score += (MAX_UNIT_COUNT - unitCount(enemy)) * 18;
      return score;
    }

    function cpuAntiAirTargetScore(u, target) {
      if (unitMovementType(target) !== "air") return -Infinity;
      let score = 0;
      if (unitMovementType(target) === "air") score += 1000;
      if (target.type === "attackHeli") score += 900;
      if (unitCount(target) <= 2) score += 120;
      if (isThreateningCriticalFacility(target, u.team)) score += 650;
      const estimate = predictCombat(u, target, false);
      if (estimate.defenderAfter <= 0) score += 380;
      return score;
    }

    function airDefenseAnchor(u) {
      const hq = findHeadquarters(u.team);
      const mainForce = state.units
        .filter(ally => ally.team === u.team && ally.id !== u.id && (ally.type === "heavyTank" || ally.type === "tank" || ally.type === "artillery"))
        .sort((a, b) => {
          const aFront = hq ? hexDistance(a.x, a.y, hq.x, hq.y) : 0;
          const bFront = hq ? hexDistance(b.x, b.y, hq.x, hq.y) : 0;
          return bFront - aFront || hexDistance(u.x, u.y, a.x, a.y) - hexDistance(u.x, u.y, b.x, b.y);
        })[0];
      return mainForce || hq || null;
    }

    function infantryMayAttack(u, target, objective) {
      const criticalDefense = isThreateningCriticalFacility(target, u.team);
      const blocksCapture = !!objective && target.x === objective.x && target.y === objective.y;
      const nearlyDestroyed = unitCount(target) <= 2;
      const lowRisk = !canCounterAttack(target, u) && target.type !== "tank" && target.type !== "heavyTank";
      if (target.type === "tank" || target.type === "heavyTank") return criticalDefense || nearlyDestroyed;
      return criticalDefense || blocksCapture || nearlyDestroyed || (!objective?.kind?.startsWith("capture") && lowRisk);
    }

    function infantryAttackScore(u, target, objective) {
      let score = 0;
      if (unitCount(target) <= 2) score += 500;
      if (isThreateningCriticalFacility(target, u.team)) score += 450;
      if (objective && target.x === objective.x && target.y === objective.y) score += 400;
      if (!canCounterAttack(target, u)) score += 120;
      if (target.type === "tank") score -= 350;
      if (target.type === "heavyTank") score -= 500;
      return score;
    }

    function isThreateningCriticalFacility(enemy, team) {
      return state.map.flat().some(cell =>
        isProperty(cell) && cell.owner === team && (cell.type === "hq" || cell.type === "factory") &&
        hexDistance(enemy.x, enemy.y, cell.x, cell.y) <= 2
      );
    }

    function nearestEnemy(u) {
      return state.units.filter(other => other.team !== u.team).sort((a, b) => hexDistance(u.x, u.y, a.x, a.y) - hexDistance(u.x, u.y, b.x, b.y))[0];
    }

    function nearestEnemyInRange(u) {
      return state.units.filter(other => other.team !== u.team).filter(other => {
        return isTargetInAttackRange(u, other);
      }).sort((a, b) => unitCount(a) - unitCount(b) || hexDistance(u.x, u.y, a.x, a.y) - hexDistance(u.x, u.y, b.x, b.y))[0];
    }

    function produceUnit(type) {
      if (gameState !== "playing" || state.active !== "blue" || state.locked || state.gameOver) return;
      const def = unitStatsFor("blue", type);
      const facility = getProductionFacilities("blue").find(cell => facilityKey(cell) === selectedFacilityKey);
      if (!def || !facility) {
        showToast("生産施設を選択してください。");
        return;
      }
      if (state.money.blue < def.cost) {
        showToast("資金が不足しています。");
        return;
      }
      state.money.blue -= def.cost;
      state.pendingProductions.push({ team: "blue", type, x: facility.x, y: facility.y, facilityType: facility.type });
      addLog(`${def.name}を生産予約しました。ターン終了時に配置されます。`);
      render();
    }

    function cpuProduce(team = "red") {
      const enemyTeam = oppositeTeam(team);
      const facilities = getProductionFacilities(team);
      if (!facilities.length || state.gameOver) return;
      const enemyHq = findHeadquarters(enemyTeam);
      const danger = assessHeadquartersDanger(team);
      const situation = evaluateStrategicSituation(team);
      const canAccelerate = situation.ownIncome >= 650 && facilities.length >= 2 && state.money[team] >= 500;
      const orderLimit = danger.isDangerous || canAccelerate ? Math.min(2, facilities.length) : 1;
      for (let order = 0; order < orderLimit; order++) {
        const allies = state.units.filter(u => u.team === team);
        const enemies = state.units.filter(u => u.team === enemyTeam);
        const queued = state.pendingProductions.filter(item => item.team === team);
        const countType = (units, type) => units.filter(u => u.type === type).length + queued.filter(item => item.type === type).length;
        const type = chooseCpuProductionType(team, allies, enemies, queued, danger, countType, situation);
        if (!type) break;
        const facility = [...facilities].sort((a, b) => cpuProductionFacilityScore(a, type, enemyHq) - cpuProductionFacilityScore(b, type, enemyHq))[0];
        state.money[team] -= unitStatsFor(team, type).cost;
        state.pendingProductions.push({ team, type, x: facility.x, y: facility.y, facilityType: facility.type });
        if (validationMatchStats) validationMatchStats.productions[team] += 1;
        state.lastCpuProduction = state.lastCpuProduction || { blue: null, red: null };
        state.lastCpuProduction[team] = type;
        const reason = danger.isDangerous ? `${teamName[team]}司令部が危険です。防衛用に` : `${teamName[team]}が`;
        addLog(`${reason}${unitNameFor(team, type)}を${terrainDefs[facility.type].name}(${facility.x},${facility.y})で生産予約。`);
      }
    }

    function chooseCpuProductionType(team, allies, enemies, queued, danger, countType, situation = evaluateStrategicSituation(team)) {
      const profile = situation.profile || getAiProfile(team);
      const counts = Object.fromEntries(producibleTypes.map(type => [type, countType(allies, type)]));
      const enemyAir = enemies.filter(u => unitMovementType(u) === "air").length;
      const enemyAntiAir = enemies.filter(u => u.type === "antiAir").length;
      const enemyArmor = enemies.filter(u => u.type === "tank" || u.type === "heavyTank").length;
      const enemyCluster = enemies.some(center => enemies.filter(other => hexDistance(center.x, center.y, other.x, other.y) <= 2).length >= 3);
      const vulnerableHeliTargets = enemies.filter(u =>
        u.type === "artillery" || u.type === "infantry" || ((u.type === "tank" || u.type === "heavyTank") && unitCount(u) <= 5)
      ).length;
      const infantryWornDown = allies.filter(u => u.type === "infantry").length > 0 && allies.filter(u => u.type === "infantry").every(u => unitCount(u) <= 4);
      const obstacleHeavyMap = state.map.flat().filter(cell => cell.type === "mountain" || cell.type === "river").length >= 35;
      const narrowFrontMap = obstacleHeavyMap || state.scenarioId === "mountainFortress" || state.scenarioId === "mountainLakeside";
      const groundCoreReady = counts.tank + counts.heavyTank >= 2;
      const scores = {
        infantry: 90,
        tank: 180,
        heavyTank: 125,
        artillery: 120,
        attackHeli: 100,
        antiAir: 35
      };
      for (const type of producibleTypes) scores[type] += evaluateProductionChoice(team, type, profile);

      scores.infantry += counts.infantry < 2 ? 460 : counts.infantry >= 4 ? -720 : counts.infantry >= 3 ? -310 : 0;
      if (infantryWornDown && counts.infantry < 5) scores.infantry += 190;
      if (counts.infantry >= 4 && !infantryWornDown) scores.infantry = -Infinity;
      scores.tank += counts.tank < 2 ? 330 : counts.tank > 3 ? -180 : 0;
      if (counts.tank + counts.heavyTank <= enemyArmor) scores.tank += 190;
      scores.heavyTank += counts.heavyTank < 1 && state.money[team] >= unitStatsFor(team, "heavyTank").cost ? 260 : counts.heavyTank >= 2 ? -210 : 0;
      scores.artillery += counts.artillery < 1 ? 220 : counts.artillery >= 2 ? -140 : 0;
      if (enemyCluster) scores.artillery += 260;
      scores.antiAir += enemyAir > 0 && counts.antiAir < Math.min(2, enemyAir) ? 430 : enemyAir === 0 ? -320 : 0;
      if (counts.antiAir >= 2) scores.antiAir -= 380;
      scores.attackHeli += counts.attackHeli < 1 ? 450 : counts.attackHeli >= 2 ? -300 : 0;
      if (state.scenarioId === "mountainLakeside") {
        scores.attackHeli += 260;
        if (counts.attackHeli < 2 && enemyAntiAir <= 1) scores.attackHeli += 420;
      }
      else if (narrowFrontMap) scores.attackHeli += 150;
      if (enemyAntiAir <= 1) scores.attackHeli += 220;
      if (enemyAntiAir >= 2) scores.attackHeli -= 420;
      scores.attackHeli += Math.min(220, vulnerableHeliTargets * 45);
      if (groundCoreReady) scores.attackHeli += 170;

      if (situation.shouldExpandEconomy) {
        if (counts.infantry < 3) scores.infantry += 240;
        scores.tank += 150;
        scores.heavyTank -= situation.phase === "early" ? 140 : 0;
      }
      if (situation.ownIncome < situation.enemyIncome) {
        if (counts.infantry < 3) scores.infantry += 140;
        scores.tank += 180;
        scores.heavyTank -= 90;
      } else if (situation.ownIncome >= situation.enemyIncome + 100) {
        scores.heavyTank += 240;
        scores.artillery += 180;
        scores.attackHeli += 140;
      }
      if (situation.phase === "early") {
        scores.heavyTank -= 100;
        scores.artillery -= 60;
      } else if (situation.phase === "late" && situation.shouldAttackHq) {
        scores.heavyTank += 180;
        scores.artillery += 160;
        scores.tank += 120;
      }

      if (danger.isDangerous) {
        scores.tank += 260;
        scores.heavyTank += danger.armor.length ? 360 : 120;
        if (danger.helicopters.length && counts.antiAir < Math.min(2, danger.helicopters.length)) scores.antiAir += 520;
        scores.artillery += danger.totalThreats >= 3 ? 240 : 0;
        scores.infantry += danger.infantry.length && counts.infantry < 3 ? 160 : -120;
        scores.attackHeli -= danger.infantry.length || danger.armor.length || danger.totalThreats >= 2 ? 260 : 80;
      }
      const lastType = state.lastCpuProduction?.[team];
      if (lastType && scores[lastType] !== undefined) scores[lastType] -= 150;
      for (const type of producibleTypes) {
        const cost = unitStatsFor(team, type).cost;
        if (state.money[team] < cost) scores[type] = -Infinity;
        else scores[type] -= cost * .08;
      }
      const ranked = producibleTypes.filter(type => Number.isFinite(scores[type])).sort((a, b) => scores[b] - scores[a]);
      const choice = ranked[0] || null;
      if (choice && counts.infantry >= 4 && choice !== "infantry") addLog(`${teamName[team]}は歩兵過多のため、${unitNameFor(team, choice)}の生産を優先します。`);
      return choice;
    }

    function evaluateProductionChoice(team, unitType, profile = getAiProfile(team)) {
      const weights = {
        infantry: profile.infantryProductionWeight,
        tank: profile.tankProductionWeight,
        heavyTank: profile.tankProductionWeight * .72,
        artillery: profile.artilleryProductionWeight,
        attackHeli: profile.helicopterProductionWeight,
        antiAir: profile.antiAirProductionWeight
      };
      return weights[unitType] ?? 0;
    }

    function assessHeadquartersDanger(team) {
      const hq = findHeadquarters(team);
      if (!hq) return { isDangerous: false, infantry: [], armor: [], helicopters: [], nearbyDefenders: 0, totalThreats: 0 };
      const enemies = state.units.filter(u => u.team !== team);
      const infantry = enemies.filter(u => u.type === "infantry" && hexDistance(u.x, u.y, hq.x, hq.y) <= 5);
      const armor = enemies.filter(u => (u.type === "tank" || u.type === "heavyTank") && hexDistance(u.x, u.y, hq.x, hq.y) <= 4);
      const helicopters = enemies.filter(u => u.type === "attackHeli" && hexDistance(u.x, u.y, hq.x, hq.y) <= 5);
      const nearbyDefenders = state.units.filter(u => u.team === team && hexDistance(u.x, u.y, hq.x, hq.y) <= 4).length;
      const lostPerimeter = state.map.flat().some(cell => isProperty(cell) && cell.owner === oppositeTeam(team) && hexDistance(cell.x, cell.y, hq.x, hq.y) <= 5);
      const totalThreats = infantry.length + armor.length + helicopters.length;
      return { infantry, armor, helicopters, nearbyDefenders, totalThreats, isDangerous: totalThreats > 0 || nearbyDefenders < 2 || lostPerimeter };
    }

    function cpuProductionFacilityScore(cell, type, enemyHq) {
      const proto = { type };
      const spots = [{ x: cell.x, y: cell.y }, ...hexNeighbors(cell.x, cell.y).map(([x, y]) => ({ x, y }))];
      const open = spots.filter(spot => !unitAt(spot.x, spot.y) && canEnterTerrain(proto, spot.x, spot.y)).length;
      const frontDistance = enemyHq ? hexDistance(cell.x, cell.y, enemyHq.x, enemyHq.y) : 20;
      const factoryBonus = cell.type === "factory" ? -4 : cell.type === "city" ? -1 : 0;
      return frontDistance - open * 1.5 + factoryBonus;
    }

    function deployPendingProductions(team) {
      if (!state.pendingProductions) state.pendingProductions = [];
      const remaining = [];
      for (const item of state.pendingProductions) {
        if (item.team !== team) {
          remaining.push(item);
          continue;
        }
        const facility = state.map[item.y]?.[item.x];
        if (!facility || !isProductionFacility(facility, team)) {
          addLog(`${unitNameFor(team, item.type)}は生産施設を失ったため出撃できませんでした。`);
          continue;
        }
        const spot = findDeploymentSpot(facility.x, facility.y, item.type);
        if (!spot) {
          remaining.push(item);
          addLog(`${terrainDefs[facility.type].name}周辺に配置場所がありません。${unitNameFor(team, item.type)}は次ターンへ持ち越します。`);
          continue;
        }
        const deployed = unit(team, item.type, spot.x, spot.y);
        markMoved(deployed);
        markAttacked(deployed);
        state.units.push(deployed);
        addLog(`${unitNameFor(team, item.type)}が${terrainDefs[facility.type].name}から出撃しました。`);
      }
      state.pendingProductions = remaining;
    }

    function findDeploymentSpot(x, y, type) {
      const proto = { type };
      const spots = [{ x, y }, ...hexNeighbors(x, y).map(([nx, ny]) => ({ x: nx, y: ny }))].filter(spot => !unitAt(spot.x, spot.y) && canEnterTerrain(proto, spot.x, spot.y));
      spots.sort((a, b) => terrainDefs[state.map[a.y][a.x].type].move - terrainDefs[state.map[b.y][b.x].type].move);
      return spots[0];
    }

    function canMove(u) {
      return !!u && !hasMoved(u);
    }

    function canAttack(u) {
      return !!u && canEverAttack(u) && !hasAttacked(u) && !hasCaptured(u) && (!hasMoved(u) || canAttackAfterMove(u));
    }

    function canAttackAfterMove(u) {
      return !!u && u.type !== "artillery" && u.type !== "antiAir" && !unitStats(u).longRange;
    }

    function attackStatusText(u) {
      if (!canEverAttack(u)) return "攻撃不可";
      if (hasAttacked(u)) return "攻撃済み";
      if (hasMoved(u) && !canAttackAfterMove(u)) return "移動後攻撃不可";
      return "攻撃可能";
    }

    function canEverAttack(u) {
      if (!u) return false;
      const def = unitStats(u);
      return (def.attack > 0 || def.airAttack > 0) && def.range > 0;
    }

    function canStandOnCapturable(u) {
      if (!u || u.type !== "infantry") return false;
      const cell = state.map[u.y][u.x];
      return isProperty(cell) && cell.owner !== u.team;
    }

    function canCapture(u) {
      return !!u && u.team === state.active && canStandOnCapturable(u) && !hasCaptured(u) && !hasAttacked(u);
    }

    function isDone(u) {
      return !!u && (hasAttacked(u) || hasCaptured(u));
    }

    function hasMoved(u) {
      return !!u && !!(u.hasMoved || u.moved);
    }

    function hasAttacked(u) {
      return !!u && !!(u.hasAttacked || u.attacked);
    }

    function hasCaptured(u) {
      return !!u && !!(u.hasCaptured || u.captured);
    }

    function hasMovedOnly(u) {
      return hasMoved(u) && !isDone(u);
    }

    function markMoved(u) {
      u.hasMoved = true;
      u.moved = true;
      u.hasActed = isDone(u);
    }

    function markAttacked(u) {
      if (lastMove?.unitId === u.id) lastMove.cancelable = false;
      u.hasAttacked = true;
      u.attacked = true;
      u.hasActed = true;
    }

    function markCaptured(u) {
      if (lastMove?.unitId === u.id) lastMove.cancelable = false;
      u.hasCaptured = true;
      u.captured = true;
      u.hasActed = true;
    }

    function collectIncome(team) {
      const income = calculateIncome(team);
      state.money[team] += income;
      state.totalIncome = state.totalIncome || { blue: 0, red: 0 };
      state.totalIncome[team] += income;
      addLog(`${teamName[team]} 収入 +${income}。`);
    }

    function facilityIncome(type) {
      if (type === "city") return 100;
      if (type === "factory") return 150;
      if (type === "hq") return 200;
      return 0;
    }

    function calculateIncome(team) {
      return state.map.flat().reduce((income, cell) => income + (isProperty(cell) && cell.owner === team ? facilityIncome(cell.type) : 0), 0);
    }

    function checkVictory() {
      if (state?.gameMode === "aiValidation") return;
      const blueUnits = state.units.filter(u => u.team === "blue");
      const redUnits = state.units.filter(u => u.team === "red");
      const redHq = state.map[14][14];
      const blueHq = state.map[0][0];
      if (redUnits.length === 0) finish("victory", "赤軍部隊が全滅しました。", "blue");
      else if (redHq.owner === "blue") finish("victory", "青軍が赤軍司令部を占領しました。", "blue");
      else if (blueUnits.length === 0) finish("defeat", "青軍部隊が全滅しました。", "red");
      else if (blueHq.owner === "red") finish("defeat", "赤軍が青軍司令部を占領しました。", "red");
    }

    function processCpuActionsFast(team) {
      cpuCaptureAssignments[team] = new Map();
      cpuDefenseAssignments[team] = new Map();
      for (const candidate of state.units.filter(unitItem => unitItem.team === team)) candidate.cpuTargetKey = null;
      const situation = evaluateStrategicSituation(team);
      const profile = getAiProfile(team);
      const cpuUnits = state.units.filter(unitItem => unitItem.team === team).sort((a, b) => a.y - b.y || a.x - b.x);
      for (const unitItem of cpuUnits) {
        if (aiValidationStopRequested || !state.units.includes(unitItem)) break;
        const objective = decideCpuAction(unitItem, team, profile, situation);
        const stationaryTarget = !canAttackAfterMove(unitItem) ? bestAttackTarget(unitItem, objective) : null;
        if (objective && canMove(unitItem) && !stationaryTarget) {
          const move = bestCpuMove(unitItem, objective);
          if (move?.path?.length) {
            const destination = move.path[move.path.length - 1];
            unitItem.x = destination.x;
            unitItem.y = destination.y;
            markMoved(unitItem);
          }
        }
        if (canCapture(unitItem)) captureUnit(unitItem);
        const enemy = shouldCpuAttack(unitItem, objective) ? (stationaryTarget || bestAttackTarget(unitItem, objective)) : null;
        if (enemy && canAttack(unitItem) && state.units.includes(enemy)) {
          const result = predictCombat(unitItem, enemy, true);
          applyBattleResult(unitItem, enemy, result);
          if (state.units.includes(unitItem)) markAttacked(unitItem);
        }
      }
    }

    function aiValidationVictory() {
      const blueUnits = state.units.filter(unitItem => unitItem.team === "blue");
      const redUnits = state.units.filter(unitItem => unitItem.team === "red");
      const headquarters = state.map.flat().filter(cell => cell.type === "hq").sort((a, b) => (a.x + a.y) - (b.x + b.y));
      const blueHq = headquarters[0];
      const redHq = headquarters[headquarters.length - 1];
      if (redHq?.owner === "blue") return { winner: "blue", reason: "hq_capture" };
      if (blueHq?.owner === "red") return { winner: "red", reason: "hq_capture" };
      if (!redUnits.length) return { winner: "blue", reason: "annihilation" };
      if (!blueUnits.length) return { winner: "red", reason: "annihilation" };
      return null;
    }

    function teamValidationMetrics(team) {
      const cells = state.map.flat();
      const units = state.units.filter(unitItem => unitItem.team === team);
      return {
        cities: cells.filter(cell => cell.type === "city" && cell.owner === team).length,
        factories: cells.filter(cell => cell.type === "factory" && cell.owner === team).length,
        income: calculateIncome(team),
        totalIncome: state.totalIncome?.[team] || 0,
        units: units.length,
        strength: units.reduce((sum, unitItem) => sum + unitCount(unitItem), 0),
        combatPower: Math.round(calculateTeamCombatPower(team)),
        kills: validationMatchStats?.kills[team] || 0,
        productions: validationMatchStats?.productions[team] || 0
      };
    }

    function judgeAiValidationMatch() {
      const blue = teamValidationMetrics("blue");
      const red = teamValidationMetrics("red");
      const score = metrics => metrics.cities * 100000 + metrics.factories * 70000 + metrics.totalIncome * 30 + metrics.strength * 400 + metrics.kills * 1200 + metrics.combatPower;
      const blueScore = score(blue);
      const redScore = score(red);
      return {
        winner: blueScore === redScore ? "draw" : blueScore > redScore ? "blue" : "red",
        reason: "economic_judgement",
        blue,
        red
      };
    }

    function runAiValidationMatch(config, matchId) {
      state = newState(config.scenarioId, "aiValidation");
      state.aiProfileKeys = { blue: config.blueProfile, red: config.redProfile };
      state.totalIncome = { blue: 0, red: 0 };
      validationMatchStats = { kills: { blue: 0, red: 0 }, productions: { blue: 0, red: 0 } };
      let outcome = null;
      for (let fullTurn = 1; fullTurn <= config.maxTurns && !outcome && !aiValidationStopRequested; fullTurn++) {
        state.turn = fullTurn;
        for (const team of ["blue", "red"]) {
          state.active = team;
          processCpuActionsFast(team);
          outcome = aiValidationVictory();
          if (outcome || aiValidationStopRequested) break;
          cpuProduce(team);
          deployPendingProductions(team);
          outcome = aiValidationVictory();
          if (outcome || aiValidationStopRequested) break;
          startTurn(oppositeTeam(team));
          outcome = aiValidationVictory();
          if (outcome) break;
        }
      }
      const judged = outcome ? { ...outcome, blue: teamValidationMetrics("blue"), red: teamValidationMetrics("red") } : judgeAiValidationMatch();
      const result = {
        id: matchId,
        timestamp: new Date().toISOString(),
        map: state.scenarioId,
        mapName: state.scenarioName,
        blueProfile: config.blueProfile,
        redProfile: config.redProfile,
        winner: judged.winner,
        reason: judged.reason,
        turns: Math.min(state.turn, config.maxTurns),
        blueCities: judged.blue.cities,
        redCities: judged.red.cities,
        blueFactories: judged.blue.factories,
        redFactories: judged.red.factories,
        blueIncome: judged.blue.income,
        redIncome: judged.red.income,
        blueTotalIncome: judged.blue.totalIncome,
        redTotalIncome: judged.red.totalIncome,
        blueUnits: judged.blue.units,
        redUnits: judged.red.units,
        blueStrength: judged.blue.strength,
        redStrength: judged.red.strength,
        blueKills: judged.blue.kills,
        redKills: judged.red.kills,
        blueProductions: judged.blue.productions,
        redProductions: judged.red.productions
      };
      validationMatchStats = null;
      return result;
    }

    function loadAiSettings() {
      try {
        const saved = JSON.parse(localStorage.getItem(AI_SETTINGS_KEY) || "null") || {};
        return {
          enemyProfile: aiProfiles[saved.enemyProfile] ? saved.enemyProfile : "balanced",
          watchBlueProfile: aiProfiles[saved.watchBlueProfile] ? saved.watchBlueProfile : "balanced",
          watchRedProfile: aiProfiles[saved.watchRedProfile] ? saved.watchRedProfile : "aggressive"
        };
      } catch {
        return { enemyProfile: "balanced", watchBlueProfile: "balanced", watchRedProfile: "aggressive" };
      }
    }

    function saveAiSettings() {
      localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(aiSettings));
    }

    function loadAiValidationResults() {
      try {
        const saved = JSON.parse(localStorage.getItem(AI_RESULTS_KEY) || "null");
        return Array.isArray(saved?.matches) ? saved.matches : [];
      } catch {
        return [];
      }
    }

    function summarizeAiValidation(matches = aiValidationResults) {
      const profiles = Object.fromEntries(Object.keys(aiProfiles).map(keyName => [keyName, { matches: 0, wins: 0, losses: 0, draws: 0, turns: 0 }]));
      const pairs = {};
      for (const match of matches) {
        const blue = profiles[match.blueProfile];
        const red = profiles[match.redProfile];
        if (blue) {
          blue.matches += 1;
          blue.turns += match.turns;
          if (match.winner === "blue") blue.wins += 1;
          else if (match.winner === "red") blue.losses += 1;
          else blue.draws += 1;
        }
        if (red) {
          red.matches += 1;
          red.turns += match.turns;
          if (match.winner === "red") red.wins += 1;
          else if (match.winner === "blue") red.losses += 1;
          else red.draws += 1;
        }
        const pairKey = `${match.blueProfile}__${match.redProfile}`;
        const pair = pairs[pairKey] ||= {
          blueProfile: match.blueProfile, redProfile: match.redProfile, matches: 0,
          blueWins: 0, redWins: 0, draws: 0, turns: 0,
          blueCities: 0, redCities: 0, blueIncome: 0, redIncome: 0
        };
        pair.matches += 1;
        pair.turns += match.turns;
        pair.blueCities += match.blueCities;
        pair.redCities += match.redCities;
        pair.blueIncome += match.blueIncome;
        pair.redIncome += match.redIncome;
        if (match.winner === "blue") pair.blueWins += 1;
        else if (match.winner === "red") pair.redWins += 1;
        else pair.draws += 1;
      }
      for (const profile of Object.values(profiles)) {
        profile.winRate = profile.matches ? profile.wins / profile.matches : 0;
        profile.averageTurns = profile.matches ? profile.turns / profile.matches : 0;
      }
      return { totalMatches: matches.length, profiles, pairs };
    }

    function aiValidationExportData() {
      return { exportedAt: new Date().toISOString(), matches: aiValidationResults, summary: summarizeAiValidation() };
    }

    function aiResultReason(reason) {
      return reason === "hq_capture" ? "司令部占領" : reason === "annihilation" ? "敵全滅" : "60ターン判定";
    }

    function renderAiValidationResults() {
      const target = document.getElementById("aiValidationResults");
      if (!target) return;
      const summary = summarizeAiValidation();
      const profileRows = Object.entries(summary.profiles).map(([keyName, item]) => `
        <tr><td>${escapeHtml(aiProfiles[keyName].name)}</td><td>${item.matches}</td><td>${item.wins}</td><td>${item.losses}</td><td>${item.draws}</td><td>${(item.winRate * 100).toFixed(1)}%</td></tr>`).join("");
      const pairRows = Object.values(summary.pairs).map(pair => `
        <div class="ai-pair-summary"><strong>${escapeHtml(aiProfiles[pair.blueProfile]?.name || pair.blueProfile)} vs ${escapeHtml(aiProfiles[pair.redProfile]?.name || pair.redProfile)}</strong><span>${pair.blueWins}勝 / ${pair.redWins}勝 / 引分${pair.draws}</span><small>平均 ${(pair.turns / pair.matches).toFixed(1)}ターン・都市 ${(pair.blueCities / pair.matches).toFixed(1)} / ${(pair.redCities / pair.matches).toFixed(1)}・収入 ${Math.round(pair.blueIncome / pair.matches)} / ${Math.round(pair.redIncome / pair.matches)}</small></div>`).join("");
      const matchRows = aiValidationResults.slice(-50).reverse().map(match => `
        <tr><td>${match.id}</td><td>${escapeHtml(match.mapName || match.map)}</td><td>${escapeHtml(aiProfiles[match.blueProfile]?.name || match.blueProfile)}</td><td>${escapeHtml(aiProfiles[match.redProfile]?.name || match.redProfile)}</td><td>${match.winner === "draw" ? "引分" : teamName[match.winner]}</td><td>${aiResultReason(match.reason)}</td><td>${match.turns}</td><td>${match.blueCities}/${match.redCities}</td><td>${match.blueKills}/${match.redKills}</td><td>${match.blueProductions}/${match.redProductions}</td></tr>`).join("");
      target.innerHTML = `
        <div class="ai-result-head"><strong>AI検証結果 ${summary.totalMatches}戦</strong><span>一覧は最新50戦を表示</span></div>
        <div class="ai-summary-grid">${pairRows || "<p>まだ対戦結果がありません。</p>"}</div>
        <div class="ai-table-wrap"><table><thead><tr><th>プロファイル</th><th>試合</th><th>勝</th><th>敗</th><th>分</th><th>勝率</th></tr></thead><tbody>${profileRows}</tbody></table></div>
        <div class="ai-table-wrap"><table><thead><tr><th>#</th><th>マップ</th><th>青AI</th><th>赤AI</th><th>勝者</th><th>理由</th><th>ターン</th><th>都市 青/赤</th><th>撃破 青/赤</th><th>生産 青/赤</th></tr></thead><tbody>${matchRows}</tbody></table></div>`;
    }

    function showAiValidationPanel() {
      titlePanelEl.innerHTML = `
        <div class="ai-validation-panel">
          <div class="scenario-heading"><strong>AI検証モード</strong><span>演出・効果音を省略したCPU高速対戦</span></div>
          <div class="ai-validation-settings">
            <label>マップ<select id="aiValidationScenario">${Object.entries(scenarioDefs).map(([id, scenario]) => `<option value="${id}" ${id === selectedScenarioId ? "selected" : ""}>${escapeHtml(scenario.name)}</option>`).join("")}</select></label>
            <label>青軍AI<select id="aiValidationBlue">${aiProfileOptions("economy")}</select></label>
            <label>赤軍AI<select id="aiValidationRed">${aiProfileOptions("aggressive")}</select></label>
            <label>最大ターン<input id="aiValidationTurns" type="number" min="10" max="200" step="10" value="${AI_MAX_TURNS}"></label>
            <label class="ai-check"><input id="aiValidationRotate" type="checkbox"> プロファイルの組み合わせを自動巡回</label>
          </div>
          <div class="ai-validation-actions">
            <button type="button" data-ai-runs="1" class="primary">AI検証開始</button>
            <button type="button" data-ai-runs="10">10戦実行</button>
            <button type="button" data-ai-runs="50">50戦実行</button>
            <button type="button" data-ai-runs="100">100戦実行</button>
            <button id="aiValidationStop" type="button" class="danger" disabled>停止</button>
            <button id="aiValidationCopy" type="button">結果をJSONでコピー</button>
            <button id="aiValidationSave" type="button">結果を保存</button>
            <button id="aiValidationClear" type="button">結果クリア</button>
          </div>
          <div id="aiValidationProgress" class="ai-validation-progress">待機中</div>
          <textarea id="aiJsonOutput" class="ai-json-output" readonly hidden aria-label="AI検証JSON"></textarea>
          <div id="aiValidationResults"></div>
        </div>`;
      titlePanelEl.classList.add("show", "ai-mode");
      titlePanelEl.parentElement?.classList.add("ai-expanded");
      for (const button of titlePanelEl.querySelectorAll("[data-ai-runs]")) button.onclick = () => {
        const progress = document.getElementById("aiValidationProgress");
        if (progress) progress.textContent = "検証を準備しています…";
        runAiValidationBatch(Number(button.dataset.aiRuns)).catch(error => {
          console.error("AI validation failed", error);
          if (progress) progress.textContent = `検証エラー: ${error?.message || error}`;
          aiValidationRunning = false;
        });
      };
      document.getElementById("aiValidationStop").addEventListener("click", () => { aiValidationStopRequested = true; });
      document.getElementById("aiValidationCopy").addEventListener("click", copyAiValidationJson);
      document.getElementById("aiValidationSave").addEventListener("click", () => {
        localStorage.setItem(AI_RESULTS_KEY, JSON.stringify(aiValidationExportData()));
        showToast("AI検証結果を保存しました。");
      });
      document.getElementById("aiValidationClear").addEventListener("click", () => {
        if (aiValidationRunning) return;
        aiValidationResults = [];
        localStorage.removeItem(AI_RESULTS_KEY);
        renderAiValidationResults();
        showToast("AI検証結果をクリアしました。");
      });
      renderAiValidationResults();
    }

    async function runAiValidationBatch(matchCount) {
      if (aiValidationRunning) return;
      const scenarioId = document.getElementById("aiValidationScenario")?.value || DEFAULT_SCENARIO_ID;
      const blueProfile = document.getElementById("aiValidationBlue")?.value || "balanced";
      const redProfile = document.getElementById("aiValidationRed")?.value || "aggressive";
      const maxTurns = Math.max(10, Math.min(200, Number(document.getElementById("aiValidationTurns")?.value) || AI_MAX_TURNS));
      const rotate = !!document.getElementById("aiValidationRotate")?.checked;
      const profilePairs = [
        ["balanced", "economy"], ["balanced", "aggressive"], ["economy", "aggressive"],
        ["economy", "defensive"], ["aggressive", "defensive"], ["airMobile", "defensive"]
      ];
      const previousState = state;
      const previousGameState = gameState;
      const previousLog = logLines;
      const previousSfx = sfxSettings;
      aiValidationRunning = true;
      aiValidationStopRequested = false;
      sfxSettings = { ...sfxSettings, enabled: false };
      const progress = document.getElementById("aiValidationProgress");
      const stopButton = document.getElementById("aiValidationStop");
      if (progress) progress.textContent = `0/${matchCount}戦：検証を開始しています…`;
      for (const button of titlePanelEl.querySelectorAll("[data-ai-runs]")) button.disabled = true;
      if (stopButton) stopButton.disabled = false;
      let completed = 0;
      try {
        for (let index = 0; index < matchCount && !aiValidationStopRequested; index++) {
          const pair = rotate ? profilePairs[index % profilePairs.length] : [blueProfile, redProfile];
          const id = (aiValidationResults.at(-1)?.id || 0) + 1;
          const result = runAiValidationMatch({ scenarioId, blueProfile: pair[0], redProfile: pair[1], maxTurns }, id);
          aiValidationResults.push(result);
          completed += 1;
          if (progress) progress.textContent = `${completed}/${matchCount}戦完了：${result.winner === "draw" ? "引分" : teamName[result.winner]}（${result.turns}ターン）`;
          renderAiValidationResults();
          await sleep(0);
        }
        localStorage.setItem(AI_RESULTS_KEY, JSON.stringify(aiValidationExportData()));
      } finally {
        validationMatchStats = null;
        sfxSettings = previousSfx;
        state = previousState;
        gameState = previousGameState;
        logLines = previousLog;
        aiValidationRunning = false;
        if (stopButton) stopButton.disabled = true;
        for (const button of titlePanelEl.querySelectorAll("[data-ai-runs]")) button.disabled = false;
        if (progress) progress.textContent = aiValidationStopRequested ? `${completed}戦で停止しました。` : `${completed}戦の検証が完了しました。`;
        render();
      }
    }

    async function copyAiValidationJson() {
      const text = JSON.stringify(aiValidationExportData(), null, 2);
      const output = document.getElementById("aiJsonOutput");
      if (output) output.value = text;
      let copied = false;
      try {
        await navigator.clipboard.writeText(text);
        copied = true;
      } catch {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        copied = document.execCommand("copy");
        textarea.remove();
      }
      if (output) {
        output.hidden = copied;
        if (!copied) {
          output.focus();
          output.select();
        }
      }
      showToast(copied ? "AI検証結果をJSONでコピーしました。" : "JSONを出力欄に表示しました。選択してコピーできます。");
    }

    function finish(result, reason, winnerTeam = result === "victory" ? "blue" : "red") {
      if (state.gameOver) return;
      state.gameOver = true;
      gameState = result;
      state.locked = false;
      watchPaused = true;
      const watchMode = state.gameMode === "cpuVsCpu";
      const victory = watchMode ? winnerTeam === "blue" : result === "victory";
      if (victory) playVictorySound();
      else playDefeatSound();
      addLog(`${victory ? "勝利" : "敗北"}。${reason}`);
      resultTitleEl.textContent = watchMode ? `${teamName[winnerTeam]}CPU勝利` : victory ? "勝利！ MISSION COMPLETE" : "敗北… MISSION FAILED";
      resultTitleEl.classList.toggle("defeat", watchMode ? winnerTeam === "red" : !victory);
      resultReasonEl.textContent = reason;
      resultScreenEl.classList.add("show");
      clearSelection();
      render();
    }

    function saveGame() {
      state.sfxSettings = { ...sfxSettings };
      localStorage.setItem(SAVE_KEY, JSON.stringify({ state, logLines, scenarioId: state.scenarioId, scenarioName: state.scenarioName, mapId: state.mapId }));
      showToast("セーブしました。");
    }

    function openExitDialog() {
      if (gameState !== "playing" || state.locked || state.gameOver || battleModalEl.classList.contains("show")) return;
      exitDialogEl.classList.add("show");
      exitDialogEl.setAttribute("aria-hidden", "false");
    }

    function closeExitDialog() {
      exitDialogEl.classList.remove("show");
      exitDialogEl.setAttribute("aria-hidden", "true");
    }

    function exitToTitle(shouldSave) {
      if (shouldSave) saveGame();
      closeExitDialog();
      bootTitle();
    }

    function loadGame() {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) {
        showToast("セーブデータがありません。");
        return;
      }
      try {
        const data = JSON.parse(raw);
        state = data.state;
        if (!state.scenarioId && data.scenarioId) state.scenarioId = data.scenarioId;
        if (!state.scenarioName && data.scenarioName) state.scenarioName = data.scenarioName;
        if (!state.mapId && data.mapId) state.mapId = data.mapId;
        migrateState(state);
        selectedScenarioId = state.scenarioId;
        lastMove = null;
        watchSession += 1;
        watchPaused = true;
        watchStepRequested = false;
        watchStopAfterTeam = null;
        gameState = state.gameMode === "cpuVsCpu" ? "watch" : "playing";
        titleScreenEl.classList.remove("show");
        stopTitleAnimation();
        resultScreenEl.classList.remove("show");
        logLines = data.logLines || ["ロードしました。"];
        selectedFacilityKey = facilityKey(getProductionFacilities("blue")[0]);
        clearSelection();
        render();
        showToast("ロードしました。");
      } catch {
        showToast("ロードに失敗しました。");
      }
    }

    function migrateState(saved) {
      saved.scenarioId = scenarioDefs[saved.scenarioId] ? saved.scenarioId : DEFAULT_SCENARIO_ID;
      saved.scenarioName = scenarioDefs[saved.scenarioId].name;
      saved.mapId = saved.mapId || scenarioDefs[saved.scenarioId].mapId || "borderRiver";
      saved.gameMode = saved.gameMode === "cpuVsCpu" ? "cpuVsCpu" : "playerVsCpu";
      saved.aiProfileKeys = {
        blue: aiProfiles[saved.aiProfileKeys?.blue] ? saved.aiProfileKeys.blue : "balanced",
        red: aiProfiles[saved.aiProfileKeys?.red] ? saved.aiProfileKeys.red : aiSettings.enemyProfile
      };
      saved.totalIncome = {
        blue: Number(saved.totalIncome?.blue) || 0,
        red: Number(saved.totalIncome?.red) || 0
      };
      if (saved.sfxSettings) {
        sfxSettings = { enabled: saved.sfxSettings.enabled !== false, volume: Math.max(0, Math.min(1, saved.sfxSettings.volume ?? .45)) };
        saveSfxSettings();
      } else {
        saved.sfxSettings = { ...sfxSettings };
      }
      if (!saved.pendingProductions) saved.pendingProductions = saved.productionQueue || [];
      if (!saved.lastCpuProduction) saved.lastCpuProduction = { blue: null, red: null };
      saved.pendingProductions = saved.pendingProductions
        .map(item => ({
          team: item.team,
          type: item.type || item.unitType,
          x: item.x ?? item.facilityCol,
          y: item.y ?? item.facilityRow,
          facilityType: item.facilityType || saved.map?.[item.y ?? item.facilityRow]?.[item.x ?? item.facilityCol]?.type || "factory"
        }))
        .filter(item => unitDefs[item.type] && (item.team === "blue" || item.team === "red") && Number.isInteger(item.x) && Number.isInteger(item.y));
      delete saved.productionQueue;
      saved.units = (saved.units || []).filter(u => unitDefs[u.type]);
      saved.locked = false;
      saved.animatingId = null;
      if (!saved.levelEffects) saved.levelEffects = [];
      const template = makeMap(saved.scenarioId);
      const oldPathPrefix = String.fromCharCode(114, 111, 97, 100);
      const stalePathKeys = [oldPathPrefix + "Connection", oldPathPrefix + "Major", oldPathPrefix + "Network", oldPathPrefix + "Path"];
      for (const row of saved.map) {
        for (const cell of row) {
          if (cell.captureTeam === undefined) cell.captureTeam = null;
          if (cell.captureDurabilityMax === undefined) cell.captureDurabilityMax = 10;
          if (cell.captureDurability === undefined) cell.captureDurability = cell.captureDurabilityMax;
          if (cell.capturePendingOwner === undefined) cell.capturePendingOwner = null;
          if (cell.captureInProgressBy === undefined) cell.captureInProgressBy = null;
          const next = template[cell.y]?.[cell.x];
          if (next) {
            const savedOwner = isProperty(cell) ? cell.owner : next.owner;
            const savedDurability = isProperty(cell) && isProperty(next) ? cell.captureDurability : next.captureDurability;
            cell.type = next.type;
            cell.owner = isProperty(next) ? savedOwner : "neutral";
            cell.captureDurability = isProperty(next) ? savedDurability : next.captureDurability;
            cell.captureDurabilityMax = next.captureDurabilityMax;
          } else {
            if (!terrainDefs[cell.type]) cell.type = "plain";
          }
          for (const prop of stalePathKeys) delete cell[prop];
        }
      }
      for (const u of saved.units) {
        const def = unitStats(u);
        delete u.fuel;
        delete u.ammo;
        if (u.type === "antiAir") {
          u.range = 4;
          u.minRange = 2;
          u.targetTypes = ["air"];
        }
        if (u.type === "artillery") {
          u.range = 3;
          u.minRange = 2;
        }
        if (u.team === "blue" && u.type === "heavyTank") u.move = 4;
        if (!u.movementType) u.movementType = def.movementType || "ground";
        if (!Array.isArray(u.targetTypes)) u.targetTypes = [...(def.targetTypes || ["ground"])];
        if (u.level === undefined) u.level = 1;
        if (u.exp === undefined) u.exp = u.xp || 0;
        if (u.xp === undefined) u.xp = u.exp || 0;
        if (u.maxLevel === undefined) u.maxLevel = 5;
        if (u.hasMoved === undefined) u.hasMoved = !!u.moved;
        if (u.hasAttacked === undefined) u.hasAttacked = !!u.attacked;
        if (u.hasCaptured === undefined) u.hasCaptured = !!u.captured;
        u.moved = !!u.hasMoved;
        u.attacked = !!u.hasAttacked;
        u.captured = !!u.hasCaptured;
        u.hasActed = isDone(u);
        if (u.supplied === undefined) u.supplied = false;
        if (u.maxCount === undefined) u.maxCount = MAX_UNIT_COUNT;
        if (u.count === undefined) u.count = MAX_UNIT_COUNT;
        u.maxCount = MAX_UNIT_COUNT;
        setUnitCount(u, u.count);
        u.hp = Math.min(u.hp, unitStats(u).hp);
      }
      for (const u of saved.units) {
        if (!canEnterTerrain(u, u.x, u.y)) {
          const spot = nearestOpenPassable(u);
          if (spot) {
            u.x = spot.x;
            u.y = spot.y;
          }
        }
      }
    }

    function nearestOpenPassable(u) {
      const candidates = [];
      for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
          if (unitAt(x, y) && unitAt(x, y).id !== u.id) continue;
          if (!canEnterTerrain(u, x, y)) continue;
          candidates.push({ x, y, d: hexDistance(u.x, u.y, x, y) });
        }
      }
      return candidates.sort((a, b) => a.d - b.d)[0];
    }

    function getProductionFacilities(team) {
      return state.map.flat().filter(cell => isProductionFacility(cell, team));
    }

    function isProductionFacility(cell, team) {
      if (!cell || !isProperty(cell) || cell.owner !== team || cell.capturePendingOwner || cell.captureInProgressBy) return false;
      const hq = findHeadquarters(team);
      if (!hq) return false;
      return cell.type === "hq" || hexDistance(cell.x, cell.y, hq.x, hq.y) <= 5;
    }

    function isProperty(cell) {
      return !!cell && (cell.type === "city" || cell.type === "factory" || cell.type === "hq");
    }

    function facilityKey(cell) {
      return cell ? `${cell.x},${cell.y}` : "";
    }

    function unitAt(x, y) {
      return state.units.find(u => u.x === x && u.y === y);
    }

    function key(x, y) {
      return `${x},${y}`;
    }

    function unitLabel(u) {
      return `${teamName[u.team]}${unitName(u)}`;
    }

    function addLog(line) {
      if (aiValidationRunning) return;
      logLines.unshift(line);
    }

    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    function escapeHtml(text) {
      return String(text).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[ch]));
    }

    function showToast(message) {
      if (aiValidationRunning) return;
      toastEl.textContent = message;
      toastEl.classList.add("show");
      clearTimeout(showToast.timer);
      showToast.timer = setTimeout(() => toastEl.classList.remove("show"), 2200);
    }

    function loadSfxSettings() {
      try {
        const saved = JSON.parse(localStorage.getItem("frontline-hex-sfx") || "null");
        return { enabled: saved?.enabled !== false, volume: Math.max(0, Math.min(1, saved?.volume ?? .45)) };
      } catch {
        return { enabled: true, volume: .45 };
      }
    }

    function saveSfxSettings() {
      try {
        localStorage.setItem("frontline-hex-sfx", JSON.stringify(sfxSettings));
      } catch {}
    }

    function unlockAudio() {
      if (!sfxSettings.enabled) return null;
      try {
        const AudioCtor = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtor) return null;
        if (!audioContext) audioContext = new AudioCtor();
        if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
        return audioContext;
      } catch {
        return null;
      }
    }

    function playTone(frequency, duration, type = "sine", gain = .12, endFrequency = frequency) {
      const ac = unlockAudio();
      if (!ac || !sfxSettings.enabled) return;
      try {
        const osc = ac.createOscillator();
        const amp = ac.createGain();
        const now = ac.currentTime;
        osc.type = type;
        osc.frequency.setValueAtTime(frequency, now);
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), now + duration);
        amp.gain.setValueAtTime(Math.max(.0001, gain * sfxSettings.volume), now);
        amp.gain.exponentialRampToValueAtTime(.0001, now + duration);
        osc.connect(amp).connect(ac.destination);
        osc.start(now);
        osc.stop(now + duration + .02);
      } catch {}
    }

    function playNoise(duration = .25, gain = .1) {
      const ac = unlockAudio();
      if (!ac || !sfxSettings.enabled) return;
      try {
        const length = Math.max(1, Math.floor(ac.sampleRate * duration));
        const buffer = ac.createBuffer(1, length, ac.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
        const source = ac.createBufferSource();
        const amp = ac.createGain();
        source.buffer = buffer;
        amp.gain.value = gain * sfxSettings.volume;
        source.connect(amp).connect(ac.destination);
        source.start();
      } catch {}
    }

    function playMovePathSounds(u, path) {
      const steps = Math.max(1, path?.length || 1);
      for (let i = 0; i < steps; i++) setTimeout(() => playUnitMoveSound(u), i * 180);
    }

    function playUnitMoveSound(u) {
      const soundKey = u?.id || u?.type || "unit";
      const now = Date.now();
      if (now - (moveSoundTimes.get(soundKey) || 0) < 120) return;
      moveSoundTimes.set(soundKey, now);
      if (u?.type === "attackHeli") {
        playTone(86, .2, "sawtooth", .045, 98);
        setTimeout(() => playTone(172, .16, "square", .02, 160), 30);
      } else if (u?.type === "infantry") {
        playTone(150, .06, "square", .045, 110);
        setTimeout(() => playTone(135, .06, "square", .04, 100), 95);
      } else if (u?.type === "antiAir") {
        playTone(76, .2, "sawtooth", .055, 54);
        setTimeout(() => playTone(230, .08, "square", .025, 180), 45);
      } else if (u?.type === "artillery") {
        playTone(62, .26, "sawtooth", .07, 42);
        setTimeout(() => playNoise(.07, .025), 55);
      } else {
        playTone(u?.type === "heavyTank" ? 52 : 70, .24, "sawtooth", .07, 44);
        setTimeout(() => playNoise(.06, .02), 45);
      }
    }

    function playMoveSound(u) {
      playUnitMoveSound(u);
    }

    function playFireSound(u) {
      if (u?.type === "attackHeli") {
        playNoise(.18, .08);
        playTone(260, .16, "square", .07, 110);
        setTimeout(() => playTone(210, .12, "square", .05, 90), 90);
      } else if (u?.type === "antiAir") {
        playTone(420, .3, "sawtooth", .09, 95);
        playNoise(.16, .065);
      } else if (u?.type === "infantry") {
        playNoise(.1, .07);
        playTone(520, .08, "square", .045, 220);
      } else {
        const heavy = u?.type === "heavyTank" || u?.type === "artillery";
        playTone(heavy ? 68 : 92, heavy ? .38 : .25, "sawtooth", heavy ? .18 : .13, 34);
        playNoise(heavy ? .32 : .2, heavy ? .14 : .09);
      }
    }

    function playExplosionSound() {
      playTone(72, .45, "sine", .16, 28);
      playNoise(.42, .16);
    }

    function playCaptureSound() {
      playTone(330, .16, "square", .08, 440);
      setTimeout(() => playTone(520, .22, "square", .08, 660), 130);
    }

    function playLevelUpSound() {
      [440, 554, 659, 880].forEach((frequency, index) => setTimeout(() => playTone(frequency, .18, "triangle", .07), index * 105));
    }

    function playVictorySound() {
      [392, 523, 659, 784].forEach((frequency, index) => setTimeout(() => playTone(frequency, .3, "triangle", .1), index * 150));
    }

    function playDefeatSound() {
      [220, 174, 131].forEach((frequency, index) => setTimeout(() => playTone(frequency, .42, "sawtooth", .08, frequency * .7), index * 180));
    }

    function playTurnSound() {
      playTone(392, .14, "triangle", .055, 494);
      setTimeout(() => playTone(587, .18, "triangle", .05), 120);
    }

    async function showTurnMessage(text, durationMs = 1100) {
      turnMessageEl.textContent = text;
      turnMessageEl.classList.add("show");
      playTurnSound();
      await sleep(durationMs);
      turnMessageEl.classList.remove("show");
      await sleep(180);
    }

    function centerCameraOnHex(row, col, durationMs = 420) {
      const world = hexToWorld(row, col);
      return animateCameraToWorld(world.x, world.y, durationMs);
    }

    function centerCameraOnUnit(u, durationMs = 420) {
      return u ? centerCameraOnHex(u.y, u.x, durationMs) : Promise.resolve();
    }

    function centerCameraBetweenHexes(row1, col1, row2, col2, durationMs = 420) {
      const a = hexToWorld(row1, col1);
      const b = hexToWorld(row2, col2);
      return animateCameraToWorld((a.x + b.x) / 2, (a.y + b.y) / 2, durationMs);
    }

    function isHexVisibleOnScreen(row, col, margin = 72) {
      const screen = worldToScreen(hexToWorld(row, col).x, hexToWorld(row, col).y);
      const safeMargin = Math.min(margin, canvasCssWidth * .2, canvasCssHeight * .2);
      return screen.x >= safeMargin && screen.x <= canvasCssWidth - safeMargin && screen.y >= safeMargin && screen.y <= canvasCssHeight - safeMargin;
    }

    function maybeCenterCameraOnUnit(u, durationMs = 560) {
      if (!u || isHexVisibleOnScreen(u.y, u.x, 78)) return Promise.resolve();
      return centerCameraOnUnit(u, durationMs);
    }

    function maybeCenterCameraBetweenUnits(a, b, durationMs = 560) {
      if (!a || !b) return Promise.resolve();
      if (isHexVisibleOnScreen(a.y, a.x, 64) && isHexVisibleOnScreen(b.y, b.x, 64)) return Promise.resolve();
      return centerCameraBetweenHexes(a.y, a.x, b.y, b.x, durationMs);
    }

    function animateCameraToWorld(worldX, worldY, durationMs) {
      if (battleModalEl.classList.contains("show")) return Promise.resolve();
      const startX = mapOffsetX;
      const startY = mapOffsetY;
      const targetX = canvasCssWidth / 2 - worldX * zoomScale;
      const targetY = canvasCssHeight / 2 - worldY * zoomScale;
      const started = performance.now();
      return new Promise(resolve => {
        const step = now => {
          const p = Math.min(1, (now - started) / Math.max(1, durationMs));
          const eased = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
          mapOffsetX = startX + (targetX - startX) * eased;
          mapOffsetY = startY + (targetY - startY) * eased;
          clampPan();
          render();
          if (p < 1) requestAnimationFrame(step);
          else resolve();
        };
        requestAnimationFrame(step);
      });
    }

    function zoomMap(delta) {
      applyZoomAt(canvasCssWidth / 2, canvasCssHeight / 2, zoomScale + delta, window.innerWidth <= 760);
    }

    function applyZoomAt(screenX, screenY, nextZoom, touchMode = false) {
      const min = touchMode ? MIN_ZOOM_TOUCH : MIN_ZOOM_PC;
      const max = touchMode ? MAX_ZOOM_TOUCH : MAX_ZOOM_PC;
      const clamped = Math.max(min, Math.min(max, nextZoom));
      if (Math.abs(clamped - zoomScale) < 0.001) return;
      const before = screenToWorld(screenX, screenY);
      zoomScale = clamped;
      HEX_SIZE = BASE_HEX_SIZE * zoomScale;
      HEX_W = Math.sqrt(3) * HEX_SIZE;
      HEX_H = 2 * HEX_SIZE;
      mapOffsetX = screenX - before.x * zoomScale;
      mapOffsetY = screenY - before.y * zoomScale;
      clampPan();
      render();
    }

    function handleWheel(event) {
      if (!canPanMap() || state.locked) return;
      event.preventDefault();
      const point = clientToCanvasPoint(event.clientX, event.clientY);
      const direction = event.deltaY < 0 ? 1 : -1;
      const factor = direction > 0 ? 1.12 : 1 / 1.12;
      applyZoomAt(point.x, point.y, zoomScale * factor, false);
    }

    function canPanMap() {
      return gameState === "playing" || gameState === "watch";
    }

    document.getElementById("endTurn").addEventListener("click", endTurn);
    document.getElementById("saveGame").addEventListener("click", saveGame);
    document.getElementById("loadGame").addEventListener("click", loadGame);
    document.getElementById("newGame").addEventListener("click", () => {
      init();
      showToast("新規ゲームを開始しました。");
    });
    document.getElementById("titleNew").addEventListener("click", () => showScenarioSelect("playerVsCpu"));
    document.getElementById("titleWatch").addEventListener("click", () => showScenarioSelect("cpuVsCpu"));
    document.getElementById("titleAiValidation").addEventListener("click", showAiValidationPanel);
    document.getElementById("titleLoad").addEventListener("click", loadGame);
    document.getElementById("titleHow").addEventListener("click", () => showTitlePanel("how"));
    document.getElementById("titleSettings").addEventListener("click", () => showTitlePanel("settings"));
    document.getElementById("titleCredits").addEventListener("click", () => showTitlePanel("credits"));
    document.getElementById("resultTitleBtn").addEventListener("click", bootTitle);
    document.getElementById("resultRetryBtn").addEventListener("click", () => init(selectedScenarioId, state.gameMode || "playerVsCpu"));
    document.getElementById("resultWatchBtn").addEventListener("click", () => {
      resultScreenEl.classList.remove("show");
      gameState = "watch";
      state.gameOver = true;
      render();
    });
    exitGameBtn.addEventListener("click", openExitDialog);
    document.getElementById("exitSave").addEventListener("click", () => exitToTitle(true));
    document.getElementById("exitDiscard").addEventListener("click", () => exitToTitle(false));
    document.getElementById("exitCancel").addEventListener("click", closeExitDialog);
    document.getElementById("watchPause").addEventListener("click", pauseWatch);
    document.getElementById("watchResume").addEventListener("click", resumeWatch);
    document.getElementById("watchStep").addEventListener("click", stepWatchTurn);
    document.getElementById("watchSpeed").addEventListener("change", event => {
      watchSpeed = ["slow", "normal", "fast", "ultra"].includes(event.target.value) ? event.target.value : "normal";
      render();
    });
    document.getElementById("watchTitle").addEventListener("click", bootTitle);
    boardEl.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("pointerdown", unlockAudio, { once: true, passive: true });
    boardEl.addEventListener("pointermove", handlePointerMove);
    boardEl.addEventListener("pointerup", handlePointerUp);
    boardEl.addEventListener("pointercancel", event => {
      activePointers.delete(event.pointerId);
      pointerState = null;
      pinchState = null;
    });
    boardEl.addEventListener("wheel", handleWheel, { passive: false });
    boardEl.addEventListener("contextmenu", event => {
      event.preventDefault();
      if (!undoLastMove()) cancelSelection();
    });
    boardEl.addEventListener("mouseleave", handleCanvasLeave);
    zoomInBtn.addEventListener("click", () => zoomMap(0.12));
    zoomOutBtn.addEventListener("click", () => zoomMap(-0.12));
    battleCloseBtn.addEventListener("click", () => {
      if (battleCloseResolver) battleCloseResolver();
    });
    window.addEventListener("resize", () => {
      clampPan();
      render();
    });
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("./service-worker.js", { scope: "./" }).catch(() => {});
      });
    }
    captureBtn.addEventListener("click", doCapture);
    undoMoveBtn.addEventListener("click", undoLastMove);
    cancelBtn.addEventListener("click", cancelSelection);

    bootTitle();
