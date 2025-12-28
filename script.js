
const TOPOLOGIES = [
    {
        id: 1,
        name: "The Triangle",
        difficulty: "Easy",
        // Switches: x,y coordinates
        switches: [
            { id: "SW1", x: 400, y: 100, mac: "00:01:00:11:11", priority: 32768 },
            { id: "SW2", x: 200, y: 400, mac: "00:01:00:22:22", priority: 32768 },
            { id: "SW3", x: 600, y: 400, mac: "00:01:00:33:33", priority: 28672 } // Lower priority = Root
        ],
        // Links: source, target, cost, port names on both ends
        links: [
            { source: "SW1", target: "SW2", cost: 19, pSource: "Gi0/1", pTarget: "Gi0/1" },
            { source: "SW1", target: "SW3", cost: 19, pSource: "Gi0/2", pTarget: "Gi0/1" },
            { source: "SW2", target: "SW3", cost: 100, pSource: "Fa0/1", pTarget: "Fa0/2" } // High cost
        ],
        // The expected answer: Only defining the strict rules. 
        // Logic: 
        // 1. Root Bridge should be SW3 (Lowest Priority 28672).
        // 2. SW3 Ports are DP.
        // 3. SW1 Path to SW3 (Root): Direct via Gi0/2 (Cost 19). SW1 Gi0/2 is RP.
        // 4. SW2 Path to SW3 (Root): Direct via Fa0/2 (Cost 100)? Or via SW1 (19+19=38)? 
        //    Wait, Path via SW1 is 38. Direct is 100. So SW2 RP is Gi0/1 (leads to SW1).
        // 5. Segment SW1-SW3: SW3 Gi0/1 (DP), SW1 Gi0/2 (RP).
        // 6. Segment SW1-SW2: Cost 19 (Link).
        //    Who wins designated? SW1 Root Cost=19. SW2 Root Cost=38. SW1 wins.
        //    SW1 Gi0/1 is DP. SW2 Gi0/1 is RP.
        // 7. Segment SW2-SW3: Cost 100.
        //    SW3 is Root. SW3 Fa0/2 is DP.
        //    SW2 Fa0/1 connects to DP. Is it RP? No, SW2 RP is Gi0/1.
        //    So SW2 Fa0/1 is BLK?
        solution: {
            rootBridge: "SW3",
            ports: {
                "SW3-Gi0/1": "DP",
                "SW3-Fa0/2": "DP",
                "SW1-Gi0/2": "RP",
                "SW1-Gi0/1": "DP",
                "SW2-Gi0/1": "RP",
                "SW2-Fa0/1": "BLK"
            },
            explanation: [
                "1. **Root Bridge**: SW3 tiene la prioridad más baja (28672).",
                "2. **Root Ports (RP)**: SW1 tiene camino directo a SW3 (costo 19) por Gi0/2. SW2 prefiere pasar por SW1? No, SW2->SW1 (19) + SW1->SW3 (19) = 38. Directo SW2->SW3 es 100. Así que SW2 elige Gi0/1 (RP) hacia SW1.",
                "3. **Segmento SW1-SW2**: SW1 tiene costo 19 al Root. SW2 tiene costo 38. SW1 gana y su puerto Gi0/1 es Designated (DP).",
                "4. **Segmento SW2-SW3**: SW3 es Root, así que Fa0/2 es DP. SW2 Fa0/1 es BLK porque el otro extremo es DP y SW2 ya tiene un RP mejor."
            ]
        }
    },
    {
        id: 2,
        name: "Two Paths",
        difficulty: "Medium",
        switches: [
            { id: "S1", x: 200, y: 150, mac: "aaaa.1111.1111", priority: 32768 },
            { id: "S2", x: 600, y: 150, mac: "aaaa.2222.2222", priority: 4096 },
            { id: "S3", x: 400, y: 450, mac: "aaaa.3333.3333", priority: 32768 }
        ],
        links: [
            { source: "S1", target: "S2", cost: 4, pSource: "Gi1/1", pTarget: "Gi1/1" },
            { source: "S2", target: "S3", cost: 4, pSource: "Gi1/2", pTarget: "Gi1/2" },
            { source: "S1", target: "S3", cost: 19, pSource: "Fa0/1", pTarget: "Fa0/1" }
        ],
        solution: {
            rootBridge: "S2", // Lowest priority
            ports: {
                "S2-Gi1/1": "DP",
                "S2-Gi1/2": "DP",
                "S1-Gi1/1": "RP", // Cost 4
                "S3-Gi1/2": "RP", // Cost 4
                "S1-Fa0/1": "DP", // Segment S1-S3. Cost S1=4, S3=4. Tie. Sender BID? S1 vs S3. MAC S1 < MAC S3? aaaa.1111... < aaaa.3333... Yes. S1 DP.
                "S3-Fa0/1": "BLK"
            },
            explanation: [
                "1. **Root Bridge**: S2 gana por Prioridad 4096 (la más baja).",
                "2. **Root Ports (RP)**: S1 y S3 están conectados directamente a S2 con costo 4. Así que S1-Gi1/1 y S3-Gi1/2 son RP.",
                "3. **Segmento S1-S3**: Ambos tienen el mismo costo al Root (4). Desempate por BID del Sender. S1 (aaaa.1111) < S3 (aaaa.3333).",
                "4. **Resultado Segmento S1-S3**: S1 gana, pone Fa0/1 en DP. S3 pierde, pone Fa0/1 en BLK."
            ]
        }
    },
    {
        id: 3,
        name: "The Ring (Square)",
        difficulty: "Medium",
        switches: [
            { id: "SW-A", x: 300, y: 100, mac: "0000.AAAA.AAAA", priority: 32768 },
            { id: "SW-B", x: 500, y: 100, mac: "0000.BBBB.BBBB", priority: 32768 },
            { id: "SW-C", x: 500, y: 300, mac: "0000.CCCC.CCCC", priority: 32768 },
            { id: "SW-D", x: 300, y: 300, mac: "0000.DDDD.DDDD", priority: 36864 } // Higher Prio
        ],
        links: [
            { source: "SW-A", target: "SW-B", cost: 19, pSource: "Fa0/1", pTarget: "Fa0/1" },
            { source: "SW-B", target: "SW-C", cost: 19, pSource: "Fa0/2", pTarget: "Fa0/2" },
            { source: "SW-C", target: "SW-D", cost: 19, pSource: "Fa0/3", pTarget: "Fa0/3" },
            { source: "SW-D", target: "SW-A", cost: 19, pSource: "Fa0/4", pTarget: "Fa0/4" }
        ],
        solution: {
            rootBridge: "SW-A", // Tie MAC A < B < C. D is high prio.
            ports: {
                "SW-A-Fa0/1": "DP",
                "SW-A-Fa0/4": "DP",
                "SW-B-Fa0/1": "RP", // Cost 19
                "SW-B-Fa0/2": "DP", // Segment B-C. Cost Root: B=19, C=38. B wins.
                "SW-D-Fa0/4": "RP", // Cost 19
                "SW-D-Fa0/3": "BLK", // Loop break. Segment C-D. Root Path: C=38 (via B), D=38 (via A)? 
                // Let's re-calc:
                // A is Root.
                // B cost to A = 19. RP=Fa0/1.
                // D cost to A = 19. RP=Fa0/4.
                // C:
                //   Via B: 19+19=38.
                //   Via D: 19+19=38.
                //   Tie! Check Upstream BID.
                //   Neighbor B: 32768:AAAA... (Wait mac B is BBBB)
                //   Neighbor D: 36864...
                //   B has better Bridge ID. So C chooses path via B.
                //   C RP = Fa0/2.
                "SW-C-Fa0/2": "RP",
                "SW-C-Fa0/3": "DP", // Segment C-D.
                // C Root Cost=38. D Root Cost=19. 
                // Wait, D is closer? D Cost=19. sry.
                // D is closer to A than C is? Yes D is direct.
                // So Segment C-D:
                // D (Cost 19) transmits BPDU. C (Cost 38) receives.
                // D wins Designated Port role for this segment.
                // So D-Fa0/3 is DP.
                // C-Fa0/3 is BLK (Alternate).
                "SW-D-Fa0/3": "DP",
                "SW-C-Fa0/3": "BLK"
            },
            explanation: [
                "1. **Root Bridge**: Prioridades iguales (32768) excepto D (36864). Empate entre A, B, C. MAC A < MAC B < MAC C. **SW-A es Root**.",
                "2. **Root Ports (RP)**: B y D están pegados a A. B-Fa0/1 RP. D-Fa0/4 RP.",
                "3. **Switch C**: ¿Camino por B o por D? Ambos cuestan 19+19=38. Desempate: BID del vecino. Vecino B (0000.BBBB) vs Vecino D (0000.DDDD). Gana B. C elige camino via B. C-Fa0/2 es RP.",
                "4. **Segmento C-D**: C cuesta 38. D cuesta 19 (directo a A). D tiene mejor costo. D gana Designated. D-Fa0/3 es DP. C-Fa0/3 bloquea (BLK)."
            ]

        }
    },
    {
        id: 4,
        name: "Double Ring (Hourglass)",
        difficulty: "Hard",
        switches: [
            { id: "Core1", x: 400, y: 50, mac: "0000.1111.1111", priority: 4096 }, // Root
            { id: "Agg1", x: 200, y: 200, mac: "0000.AAAA.AAAA", priority: 32768 },
            { id: "Agg2", x: 600, y: 200, mac: "0000.BBBB.BBBB", priority: 32768 },
            { id: "Acc1", x: 300, y: 400, mac: "0000.CCCC.CCCC", priority: 32768 },
            { id: "Acc2", x: 500, y: 400, mac: "0000.DDDD.DDDD", priority: 32768 }
        ],
        links: [
            { source: "Core1", target: "Agg1", cost: 19, pSource: "G1/1", pTarget: "G1/1" },
            { source: "Core1", target: "Agg2", cost: 19, pSource: "G1/2", pTarget: "G1/2" },
            { source: "Agg1", target: "Agg2", cost: 19, pSource: "G1/3", pTarget: "G1/3" }, // Cross link
            { source: "Agg1", target: "Acc1", cost: 19, pSource: "F0/1", pTarget: "F0/1" },
            { source: "Agg2", target: "Acc2", cost: 19, pSource: "F0/1", pTarget: "F0/1" },
            { source: "Acc1", target: "Acc2", cost: 19, pSource: "F0/2", pTarget: "F0/2" }
        ],
        solution: {
            rootBridge: "Core1",
            ports: {
                "Core1-G1/1": "DP",
                "Core1-G1/2": "DP",
                "Agg1-G1/1": "RP",
                "Agg2-G1/2": "RP",
                "Agg1-G1/3": "DP", // Agg1 vs Agg2. Same cost. Agg1 MAC < Agg2 MAC? Yes (AAAA < BBBB). Agg1 DP.
                "Agg2-G1/3": "BLK",
                "Agg1-F0/1": "DP",
                "Agg2-F0/1": "DP",
                "Acc1-F0/1": "RP",
                "Acc2-F0/1": "RP",
                "Acc1-F0/2": "DP", // Acc1 vs Acc2. Path cost 38 each. Acc1 MAC < Acc2 MAC. Acc1 DP.
                "Acc2-F0/2": "BLK"
            },
            explanation: [
                "1. **Root**: Core1 (Lowest Priority 4096).",
                "2. **Layer 2 (Agg)**: Agg1 & Agg2 connect directly. RP are uplink ports to Core1.",
                "3. **Agg Cross-link**: Agg1 & Agg2 same cost. Agg1 MAC lower -> Agg1 Designated. Agg2 blocks.",
                "4. **Layer 3 (Access)**: Acc1 & Acc2 connect to Agg layer. Cost 19+19=38. RP are uplinks.",
                "5. **Access Cross-link**: Acc1 & Acc2 same cost. Tie-breaker Sender BID. Acc1 MAC < Acc2 MAC. Acc1 wins DP. Acc2 blocks."
            ]
        }
    },
    {
        id: 5,
        name: "Full Mesh Chaos",
        difficulty: "Hard",
        switches: [
            { id: "S1", x: 400, y: 100, mac: "00:00:00:00:11", priority: 32768 },
            { id: "S2", x: 650, y: 250, mac: "00:00:00:00:22", priority: 32768 },
            { id: "S3", x: 550, y: 450, mac: "00:00:00:00:33", priority: 32768 },
            { id: "S4", x: 250, y: 450, mac: "00:00:00:00:44", priority: 32768 },
            { id: "S5", x: 150, y: 250, mac: "00:00:00:00:55", priority: 32768 }
        ],
        links: [
            { source: "S1", target: "S2", cost: 19, pSource: "P1", pTarget: "P1" },
            { source: "S2", target: "S3", cost: 19, pSource: "P2", pTarget: "P2" },
            { source: "S3", target: "S4", cost: 19, pSource: "P3", pTarget: "P3" },
            { source: "S4", target: "S5", cost: 19, pSource: "P4", pTarget: "P4" },
            { source: "S5", target: "S1", cost: 19, pSource: "P5", pTarget: "P5" },
            // Cross links
            { source: "S1", target: "S3", cost: 4, pSource: "G1", pTarget: "G1" }, // Short cut!
            { source: "S1", target: "S4", cost: 4, pSource: "G2", pTarget: "G2" }  // Short cut!
        ],
        solution: {
            rootBridge: "S1", // Lowest MAC
            ports: {
                // S1 ports are all DP
                "S1-P1": "DP", "S1-P5": "DP", "S1-G1": "DP", "S1-G2": "DP",

                // Neighbors
                "S3-G1": "RP", // Cost 4
                "S4-G2": "RP", // Cost 4
                "S2-P1": "RP", // Cost 19
                "S5-P5": "RP", // Cost 19

                // Segments
                // S3-S4 (Cost 19). Root Cost: S3=4, S4=4. Tie. S3 MAC < S4 MAC. S3 DP.
                "S3-P3": "DP",
                "S4-P3": "BLK",

                // S2-S3 (Cost 19). Root Cost: S3=4! S2=19. S3 is superior. S3 DP.
                "S3-P2": "DP",
                "S2-P2": "BLK",

                // S4-S5 (Cost 19). Root Cost: S4=4! S5=19. S4 is superior. S4 DP.
                "S4-P4": "DP",
                "S5-P4": "BLK"
            },
            explanation: [
                "1. **Root**: S1 has lowest MAC (11).",
                "2. **Gigabit Shortcuts**: S3 and S4 have Gigabit links (Cost 4) to Root. These become their RPs.",
                "3. **Outer Ring**: S2 and S5 have FastEthernet links (Cost 19) to Root. These are their RPs.",
                "4. **Chaos Segments**: Because S3 and S4 are so close to Root (Cost 4), they become the upstream bridges for S2 and S5? Wait, let's check segment S2-S3.",
                "5. **S2-S3**: S3 Cost=4. S2 Cost=19. S3 wins Designated. S2 port blocks.",
                "6. **S4-S5**: S4 Cost=4. S5 Cost=19. S4 wins Designated. S5 port blocks.",
                "7. **S3-S4**: Both Cost 4. Tie-breaker Sender MAC. S3 < S4. S3 wins Designated. S4 blocks."
            ]
        }
    },
    {
        id: 6,
        name: "Speed Trap",
        difficulty: "Hard",
        description: "Watch out! Link speeds vary wildly (10G vs 100M).",
        switches: [
            { id: "Core", x: 400, y: 100, mac: "0000.AAAA.AAAA", priority: 4096 },
            { id: "SW1", x: 200, y: 300, mac: "0000.BBBB.BBBB", priority: 32768 },
            { id: "SW2", x: 600, y: 300, mac: "0000.CCCC.CCCC", priority: 32768 },
            { id: "Access", x: 400, y: 450, mac: "0000.DDDD.DDDD", priority: 32768 }
        ],
        links: [
            { source: "Core", target: "SW1", cost: 19, pSource: "Fa0/1", pTarget: "Fa0/1" }, // Slow 100M
            { source: "Core", target: "SW2", cost: 2, pSource: "Te1/1", pTarget: "Te1/1" }, // Fast 10G
            { source: "SW1", target: "Access", cost: 19, pSource: "Fa0/2", pTarget: "Fa0/1" },
            { source: "SW2", target: "Access", cost: 4, pSource: "Gi1/1", pTarget: "Gi1/1" } // Med 1G
        ],
        solution: {
            rootBridge: "Core",
            ports: {
                "Core-Fa0/1": "DP", "Core-Te1/1": "DP",
                "SW1-Fa0/1": "RP", // Cost 19
                "SW2-Te1/1": "RP", // Cost 2
                "SW2-Gi1/1": "DP", // Segment SW2-Acc. SW2 RootCost=2. Access RootCost via SW1=19+19=38. SW2 wins easily.
                "Access-Gi1/1": "RP", // Path via SW2 = 2+4 = 6 using 1G link. Path via SW1 = 19+19 = 38. SW2 path wins!
                "SW1-Fa0/2": "DP", // Segment SW1-Acc. SW1 Cost=19. Access Cost=6. Access is closer!! Access wins DP. SW1 blocks? Wait.
                // Segment SW1-Acc logic:
                // SW1 Root Path Cost = 19.
                // Access Root Path Cost = 6 (via SW2).
                // Access transmits superior BPDU (Cost 6).
                // Access wins Designated Port role for this segment!
                // So Access-Fa0/1 is DP.
                // SW1-Fa0/2 is BLK (Alternate).
                "Access-Fa0/1": "DP",
                "SW1-Fa0/2": "BLK"
            },
            explanation: [
                "1. **Cost Math**: Core-SW2 (10G) is Cost 2. Core-SW1 (100M) is Cost 19.",
                "2. **Access Switch**: Path via SW2 (Cost 2 + 4 = 6). Path via SW1 (Cost 19 + 19 = 38). Path SW2 wins clearly.",
                "3. **The Trap**: Segment SW1-Access. Who is Designated? Access has Root Cost 6. SW1 has Root Cost 19. Access is 'superior'! Access becomes DP. SW1 blocks."
            ]
        }
    },
    {
        id: 7,
        name: "Core HA + WAN",
        difficulty: "Hard",
        description: "Redundant Core setup. HSRP style.",
        switches: [
            { id: "Core-A", x: 300, y: 100, mac: "0000.1111.1111", priority: 4096 }, // Root Primary
            { id: "Core-B", x: 500, y: 100, mac: "0000.2222.2222", priority: 8192 }, // Root Secondary
            { id: "Dist-1", x: 400, y: 300, mac: "0000.3333.3333", priority: 32768 }
        ],
        links: [
            { source: "Core-A", target: "Core-B", cost: 4, pSource: "Gi0/1", pTarget: "Gi0/1" }, // Trunk
            { source: "Core-A", target: "Dist-1", cost: 19, pSource: "Fa0/1", pTarget: "Fa0/1" },
            { source: "Core-B", target: "Dist-1", cost: 19, pSource: "Fa0/2", pTarget: "Fa0/2" }
        ],
        solution: {
            rootBridge: "Core-A",
            ports: {
                "Core-A-Gi0/1": "DP", "Core-A-Fa0/1": "DP",
                "Core-B-Gi0/1": "RP", // Direct to Root
                "Core-B-Fa0/2": "DP", // Segment B-Dist. B Cost 4. Dist Cost 19. B wins.
                "Dist-1-Fa0/1": "RP", // Direct to Root (19) better than via B (4+19=23).
                "Dist-1-Fa0/2": "BLK" // Block redundant path to B.
            },
            explanation: [
                "1. **Root**: Core-A (Priority 4096).",
                "2. **Core-B**: RP is the direct link (Gi0/1) to A.",
                "3. **Dist-1**: Direct link to A (Cost 19) is better than path via B (Cost 4+19=23). So Fa0/1 is RP.",
                "4. **Loop**: Fa0/2 blocks to prevent loop through Core-B."
            ]
        }
    },
    {
        id: 8,
        name: "The 7-Switch Snake",
        difficulty: "Hard",
        description: "Long daisy chain with backdoors.",
        switches: [
            { id: "Head", x: 100, y: 250, mac: "00:01", priority: 4096 },
            { id: "Mid1", x: 250, y: 150, mac: "00:02", priority: 32768 },
            { id: "Mid2", x: 250, y: 350, mac: "00:03", priority: 32768 },
            { id: "Tail", x: 700, y: 250, mac: "00:09", priority: 32768 }
        ],
        links: [
            // Simplified for screen space - actually a diamond
            { source: "Head", target: "Mid1", cost: 19, pSource: "P1", pTarget: "P1" },
            { source: "Head", target: "Mid2", cost: 19, pSource: "P2", pTarget: "P2" },
            { source: "Mid1", target: "Tail", cost: 19, pSource: "P3", pTarget: "P3" },
            { source: "Mid2", target: "Tail", cost: 100, pSource: "P4", pTarget: "P4" }, // Slow link
            { source: "Mid1", target: "Mid2", cost: 4, pSource: "G1", pTarget: "G1" } // Cross link
        ],
        solution: {
            rootBridge: "Head",
            ports: {
                "Head-P1": "DP", "Head-P2": "DP",
                "Mid1-P1": "RP",
                "Mid2-P2": "RP",
                "Mid1-G1": "DP", "Mid2-G1": "BLK", // Mid1 (19) vs Mid2 (19). Tie. Mid1 MAC < Mid2 MAC. Mid1 DP.
                "Mid1-P3": "DP", // Segment Mid1-Tail.
                "Tail-P3": "RP", // Path via Mid1 (19+19=38). Path via Mid2 (19+100=119). Mid1 best.
                "Tail-P4": "BLK",
                "Mid2-P4": "DP"
            },
            explanation: [
                "1. **Root**: Head.",
                "2. **Mid Nodes**: Direct links RP.",
                "3. **Cross Link**: Mid1 vs Mid2. Same cost (19). Mid1 lower MAC. Mid1 side DP, Mid2 side BLK.",
                "4. **Tail**: Path via Mid1 (Cost 38) beats Mid2 (Cost 119). P3 is RP.",
                "5. **Tail-Mid2 Segment**: Mid2 (Cost 19) transmits. Tail (Cost 38) receives. Mid2 wins Designated. Tail blocks."
            ]
        }
    }
];

let gameState = {
    currentScenarioIndex: 0,
    selectedRoot: null,
    portRoles: {},
    correctCount: 0,
    errorCount: 0,
    currentDifficulty: 'Easy',
    filteredTopologies: []
};


// DOM Elements
const svgLayer = document.getElementById("svg-layer");
const feedbackArea = document.getElementById("feedback-area");
const btnCheck = document.getElementById("btn-check");
const btnNext = document.getElementById("btn-next");
const btnReset = document.getElementById("btn-reset");
const explanationContainer = document.getElementById("explanation-container");
const explanationContent = document.getElementById("explanation-content");
// Menu Elements
const mainMenu = document.getElementById("main-menu");
const gameInterface = document.getElementById("game-interface");
const btnBackMenu = document.getElementById("btn-back-menu");
const levelList = document.getElementById("level-list");
const btnStartLevel = document.getElementById("btn-start-level");
const previewContainer = document.getElementById("preview-canvas");

// Init
function init() {
    // Show Menu, Hide Game logic is handled by CSS/HTML states initially
    btnCheck.addEventListener("click", checkSolution);
    btnNext.addEventListener("click", nextLevel);
    btnReset.addEventListener("click", resetCurrent);
    btnBackMenu.addEventListener("click", showMenu);

    // Make global for html onclick
    btnStartLevel.addEventListener("click", () => startLevel(selectedPreviewId));
    populateLevelList();
}

let selectedPreviewId = null;

function populateLevelList() {
    levelList.innerHTML = '';

    TOPOLOGIES.forEach(topo => {
        const item = document.createElement("div");
        item.className = "level-item";
        item.setAttribute("data-id", topo.id);
        item.innerHTML = `
            <span class="lvl-badge ${topo.difficulty}">${topo.difficulty}</span>
            <span class="lvl-name">${topo.name}</span>
        `;
        item.addEventListener("click", () => showPreview(topo.id));
        levelList.appendChild(item);
    });

    // Select first by default
    if (TOPOLOGIES.length > 0) {
        showPreview(TOPOLOGIES[0].id);
    }
}

function showPreview(id) {
    selectedPreviewId = id;
    const scenario = TOPOLOGIES.find(t => t.id === id);
    if (!scenario) return;

    // Highlight list item
    document.querySelectorAll(".level-item").forEach(el => el.classList.remove("active"));
    const activeItem = document.querySelector(`.level-item[data-id="${id}"]`);
    if (activeItem) activeItem.classList.add("active");

    // Update Info
    const prevTitle = document.getElementById("prev-title");
    const prevDesc = document.getElementById("prev-desc");
    if (prevTitle) prevTitle.textContent = scenario.name;
    if (prevDesc) prevDesc.textContent = scenario.description || `A ${scenario.difficulty} challenge with ${scenario.switches.length} switches.`;

    btnStartLevel.disabled = false;

    // Simple Preview Render (Miniature)
    renderPreviewTopology(scenario);
}

function renderPreviewTopology(scenario) {
    // Similar to renderTopology but strictly for preview-canvas
    // Clear
    previewContainer.innerHTML = '';

    const svg = createSVGElement("svg", {
        width: "100%", height: "100%",
        viewBox: "0 0 800 500" // Use same coord system
    });

    // Draw simple map (lines + boxes)
    scenario.links.forEach(link => {
        const s1 = scenario.switches.find(s => s.id === link.source);
        const s2 = scenario.switches.find(s => s.id === link.target);
        if (s1 && s2) {
            const line = createSVGElement("line", {
                x1: s1.x, y1: s1.y, x2: s2.x, y2: s2.y,
                stroke: "#475569", "stroke-width": 4
            });
            svg.appendChild(line);
        }
    });

    scenario.switches.forEach(sw => {
        const rect = createSVGElement("rect", {
            x: sw.x - 30, y: sw.y - 15,
            width: 60, height: 30,
            fill: "#334155", rx: 4
        });
        svg.appendChild(rect);
    });

    previewContainer.appendChild(svg);
}

function startLevel(id) {
    // Find index
    const index = TOPOLOGIES.findIndex(t => t.id === id);
    if (index === -1) return;

    // In this mode, we just use full list for navigation
    gameState.filteredTopologies = TOPOLOGIES;

    // Switch UI
    mainMenu.classList.add("hidden");
    gameInterface.classList.remove("hidden");

    loadScenario(index);
}



function showMenu() {
    mainMenu.classList.remove("hidden");
    gameInterface.classList.add("hidden");
}

function nextLevel() {
    const nextIdx = gameState.currentScenarioIndex + 1;
    loadScenario(nextIdx);
}

function loadScenario(index) {
    if (index >= gameState.filteredTopologies.length) {
        alert("¡Nivel completado! Volviendo al menú.");
        showMenu();
        return;
    }

    gameState.currentScenarioIndex = index;
    gameState.selectedRoot = null;
    gameState.portRoles = {};

    // UI Updates
    const scenario = gameState.filteredTopologies[index];
    document.getElementById("scenario-name").textContent = `${scenario.name}`;
    document.getElementById("difficulty").textContent = scenario.difficulty;

    btnNext.classList.add("hidden");
    feedbackArea.style.display = 'none';
    explanationContainer.classList.add("hidden"); // Hide previous explanation
    explanationContent.innerHTML = '';
    btnCheck.disabled = false;

    renderTopology(scenario);
}

function renderTopology(scenario) {
    // Clear SVG
    svgLayer.innerHTML = '';

    // 1. Render Links
    scenario.links.forEach(link => {
        const s1 = scenario.switches.find(s => s.id === link.source);
        const s2 = scenario.switches.find(s => s.id === link.target);

        // Draw Line
        const line = createSVGElement("line", {
            x1: s1.x, y1: s1.y,
            x2: s2.x, y2: s2.y,
            class: "link-line"
        });
        svgLayer.appendChild(line);

        // Draw Cost Label (Offset from Midpoint)
        const midX = (s1.x + s2.x) / 2;
        const midY = (s1.y + s2.y) / 2;

        // Calculate offset vector (perpendicular to link)
        const dx = s2.x - s1.x;
        const dy = s2.y - s1.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        // Unit normal vector (-dy, dx) normalized
        const nx = -dy / len;
        const ny = dx / len;

        // Push out by 25px
        const labelX = midX + nx * 25;
        const labelY = midY + ny * 25;

        // Background for cost
        const costBg = createSVGElement("rect", {
            x: labelX - 20, y: labelY - 12,
            width: 40, height: 24,
            rx: 6, fill: "#0f172a",
            stroke: "#334155", "stroke-width": 1
        });
        svgLayer.appendChild(costBg);

        const costText = createSVGElement("text", {
            x: labelX, y: labelY + 4,
            class: "link-cost-text",
            "text-anchor": "middle"
        });
        costText.textContent = link.cost;
        svgLayer.appendChild(costText);

        // Draw Ports at ends
        drawPort(s1, s2, link.pSource, s1.id);
        drawPort(s2, s1, link.pTarget, s2.id);
    });

    // 2. Render Switches
    scenario.switches.forEach(sw => {
        const group = createSVGElement("g", {
            class: "switch-group",
            "data-id": sw.id,
            transform: `translate(${sw.x}, ${sw.y})`
        });

        // Switch Body
        const rect = createSVGElement("rect", {
            x: -60, y: -30,
            width: 120, height: 60,
            class: `switch-rect ${gameState.selectedRoot === sw.id ? 'is-root' : ''}`,
            fill: "#334155"
        });

        // Text: Name
        const label = createSVGElement("text", {
            x: 0, y: -5,
            class: "switch-label",
            "text-anchor": "middle"
        });
        label.textContent = sw.id;

        // Text: Details
        const details1 = createSVGElement("text", {
            x: 0, y: 12,
            class: "switch-detail",
            "text-anchor": "middle"
        });
        details1.textContent = `Prio: ${sw.priority}`;

        const details2 = createSVGElement("text", {
            x: 0, y: 24,
            class: "switch-detail",
            "text-anchor": "middle"
        });
        details2.textContent = sw.mac;

        group.appendChild(rect);
        group.appendChild(label);
        group.appendChild(details1);
        group.appendChild(details2);

        // Event Listener for Root Selection
        group.addEventListener("click", () => {
            toggleRootSelection(sw.id);
        });

        svgLayer.appendChild(group);
    });
}

function drawPort(sourceNode, targetNode, portName, switchId) {
    // Calculate position slightly offset from source towards target
    const dx = targetNode.x - sourceNode.x;
    const dy = targetNode.y - sourceNode.y;
    const angle = Math.atan2(dy, dx);

    // Offset from center of switch (rect is 120x60, so approx 70 radius)
    const distance = 80;
    const px = sourceNode.x + Math.cos(angle) * distance;
    const py = sourceNode.y + Math.sin(angle) * distance;

    const portId = `${switchId}-${portName}`;
    const role = gameState.portRoles[portId];

    const circle = createSVGElement("circle", {
        cx: px, cy: py,
        class: "port-circle",
        "data-id": portId,
        "data-role": role || ""
    });

    // Port Label
    const text = createSVGElement("text", {
        x: px, y: py - 12,
        class: "port-label",
        "text-anchor": "middle"
    });
    text.textContent = portName;

    // Click Event
    circle.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent clicking switch below

        cyclePortRole(portId);
        renderTopology(gameState.filteredTopologies[gameState.currentScenarioIndex]); // Re-render to update state
    });

    svgLayer.appendChild(circle);
    svgLayer.appendChild(text);
}

function createSVGElement(tag, attrs) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [key, value] of Object.entries(attrs)) {
        el.setAttribute(key, value);
    }
    return el;
}

// Logic Interactions
function toggleRootSelection(id) {
    // Only one root
    gameState.selectedRoot = id;
    renderTopology(gameState.filteredTopologies[gameState.currentScenarioIndex]);
}

function cyclePortRole(portId) {
    const roles = [null, "RP", "DP", "BLK"];
    const current = gameState.portRoles[portId] || null;
    const nextIndex = (roles.indexOf(current) + 1) % roles.length;

    const nextRole = roles[nextIndex];
    if (nextRole) {
        gameState.portRoles[portId] = nextRole;
    } else {
        delete gameState.portRoles[portId];
    }
}

function resetCurrent() {
    loadScenario(gameState.currentScenarioIndex);
}

function checkSolution() {
    const scenario = gameState.filteredTopologies[gameState.currentScenarioIndex];
    const solution = scenario.solution;

    let errors = [];

    // 1. Check Root Bridge
    if (gameState.selectedRoot !== solution.rootBridge) {
        errors.push("❌ Root Bridge incorrecto. Revisa las prioridades y MACs.");
    }

    // 2. Check Ports
    for (const [key, role] of Object.entries(solution.ports)) {
        const userRole = gameState.portRoles[key];
        if (userRole !== role) {
            // Friendly error message
            const sw = key.split("-")[0];
            errors.push(`❌ Puerto ${key} debería ser ${role}.`);
        }
    }

    // 3. User marked extra ports?
    for (const key of Object.keys(gameState.portRoles)) {
        if (!solution.ports[key]) {
            errors.push(`❌ Puerto ${key} no necesita rol (o no existe en solución).`);
        }
    }

    // Display Feedback
    if (errors.length === 0) {
        showFeedback("¡CORRECTO! Has analizado la red perfectamente.", "success");
        document.getElementById("score-correct").textContent = ++gameState.correctCount;
        btnNext.classList.remove("hidden");
        btnCheck.disabled = true;

        // Show Detailed Explanation
        if (scenario.solution.explanation) {
            renderExplanation(scenario.solution.explanation);
        }
    } else {
        showFeedback(errors[0] + (errors.length > 1 ? ` (+${errors.length - 1} errores más)` : ""), "error");
        document.getElementById("score-errors").textContent = ++gameState.errorCount;
    }
}

function renderExplanation(lines) {
    explanationContent.innerHTML = lines.map(line => {
        // Simple markdown parser for bold
        const html = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return `<div class="xp-item"><span class="xp-reason">${html}</span></div>`;
    }).join("");
    explanationContainer.classList.remove("hidden");
}

function showFeedback(msg, type) {
    feedbackArea.textContent = msg;
    feedbackArea.className = ""; // Reset
    feedbackArea.classList.add(type);
    feedbackArea.style.display = "block";

    // Shake effect on error
    if (type === "error") {
        feedbackArea.classList.add("shake");
        setTimeout(() => feedbackArea.classList.remove("shake"), 500);
    }
}

// Start
// ==========================================
// STP SOLVER ENGINE
// ==========================================
const STPSolver = {
    solve: function (switches, links) {
        // 1. Find Root Bridge
        // Priority then MAC
        const sortedSwitches = [...switches].sort((a, b) => {
            if (a.priority !== b.priority) return a.priority - b.priority;
            return a.mac.localeCompare(b.mac);
        });
        const root = sortedSwitches[0];

        // 2. Calculate Costs (Dijkstra-ish)
        const costs = {}; // { switchId: { cost: number, viaPort: string, neighborId: string } }
        switches.forEach(s => costs[s.id] = { cost: Infinity, viaPort: null, neighbor: null });
        costs[root.id] = { cost: 0, viaPort: null, neighbor: null };

        // Simple relaxation loop
        let changed = true;
        let loops = 0;
        while (changed && loops < 100) {
            changed = false;
            loops++;
            links.forEach(link => {
                const s1 = link.source;
                const s2 = link.target;

                // Relax S1 -> S2
                if (costs[s1].cost !== Infinity) {
                    const newCost = costs[s1].cost + link.cost;
                    if (newCost < costs[s2].cost) {
                        costs[s2] = { cost: newCost, viaPort: link.pTarget, neighbor: s1 };
                        changed = true;
                    } else if (newCost === costs[s2].cost) {
                        // Tie breaker: Neighbor BID
                        const currentNeighbor = switches.find(s => s.id === costs[s2].neighbor);
                        const newNeighbor = switches.find(s => s.id === s1);

                        if (currentNeighbor && newNeighbor) {
                            if (this.compareBID(newNeighbor, currentNeighbor) < 0) {
                                costs[s2] = { cost: newCost, viaPort: link.pTarget, neighbor: s1 };
                                changed = true;
                            }
                        }
                    }
                }

                // Relax S2 -> S1
                if (costs[s2].cost !== Infinity) {
                    const newCost = costs[s2].cost + link.cost;
                    if (newCost < costs[s1].cost) {
                        costs[s1] = { cost: newCost, viaPort: link.pSource, neighbor: s2 };
                        changed = true;
                    } else if (newCost === costs[s1].cost) {
                        const currentNeighbor = switches.find(s => s.id === costs[s1].neighbor);
                        const newNeighbor = switches.find(s => s.id === s2);
                        if (currentNeighbor && newNeighbor) {
                            if (this.compareBID(newNeighbor, currentNeighbor) < 0) {
                                costs[s1] = { cost: newCost, viaPort: link.pSource, neighbor: s2 };
                                changed = true;
                            }
                        }
                    }
                }
            });
        }

        // 3. Assign Ports
        const ports = {};
        const explanation = [];
        explanation.push(`1. **Root Bridge**: ${root.id} (Prioridad ${root.priority}, MAC ${root.mac}).`);

        // A. Root Ports
        switches.forEach(s => {
            if (s.id !== root.id) {
                const rp = costs[s.id].viaPort;
                if (rp) ports[`${s.id}-${rp}`] = "RP";
            }
        });
        explanation.push(`2. **Root Ports** calculados basándose en el menor Costo hacia la Root.`);

        // B. Designated vs Blocking
        links.forEach(link => {
            const id1 = `${link.source}-${link.pSource}`;
            const id2 = `${link.target}-${link.pTarget}`;
            const role1 = ports[id1];
            const role2 = ports[id2];

            if (role1 === "RP") {
                ports[id2] = "DP";
            } else if (role2 === "RP") {
                ports[id1] = "DP";
            } else {
                // Battle for DP
                const c1 = costs[link.source].cost;
                const c2 = costs[link.target].cost;
                let winner = 1; // 1 or 2

                if (c1 < c2) winner = 1;
                else if (c2 < c1) winner = 2;
                else {
                    const s1Obj = switches.find(s => s.id === link.source);
                    const s2Obj = switches.find(s => s.id === link.target);
                    if (this.compareBID(s1Obj, s2Obj) > 0) winner = 2; // Lower is better
                }

                if (winner === 1) {
                    ports[id1] = "DP";
                    ports[id2] = "BLK";
                } else {
                    ports[id2] = "DP";
                    ports[id1] = "BLK";
                }
            }
        });

        return {
            rootBridge: root.id,
            ports: ports,
            explanation: explanation
        };
    },

    compareBID(s1, s2) {
        if (s1.priority !== s2.priority) return s1.priority - s2.priority;
        return s1.mac.localeCompare(s2.mac);
    }
};

// ==========================================
// LEVEL GENERATOR
// ==========================================
const LevelGenerator = {
    generate: function (count) {
        const newLevels = [];
        for (let i = 0; i < count; i++) {
            newLevels.push(this.createLevel(i));
        }
        return newLevels;
    },

    createLevel: function (index) {
        const switchCount = 4 + Math.floor(Math.random() * 3);
        const switches = [];
        const width = 800, height = 500;

        // Create Switches
        for (let i = 0; i < switchCount; i++) {
            switches.push({
                id: `S${i + 1}`,
                x: width / 2 + Math.cos(2 * Math.PI * i / switchCount) * 250 + (Math.random() * 50 - 25),
                y: height / 2 + Math.sin(2 * Math.PI * i / switchCount) * 180 + (Math.random() * 50 - 25),
                mac: this.randomMAC(),
                priority: Math.random() > 0.8 ? 4096 : 32768
            });
        }

        // Create Links
        const links = [];
        // Ring
        for (let i = 0; i < switchCount; i++) {
            const next = (i + 1) % switchCount;
            links.push(this.createLink(switches[i], switches[next], i));
        }
        // Helper to check existence
        const exists = (a, b) => links.some(l =>
            (l.source === a && l.target === b) || (l.source === b && l.target === a)
        );

        // Random Extras
        const extras = Math.floor(Math.random() * 2) + 1;
        let attempts = 0;
        for (let j = 0; j < extras; j++) {
            let s1, s2;
            attempts = 0;
            do {
                s1 = Math.floor(Math.random() * switchCount);
                s2 = Math.floor(Math.random() * switchCount);
                attempts++;
            } while ((s1 === s2 || exists(switches[s1].id, switches[s2].id)) && attempts < 20);

            if (attempts < 20) {
                links.push(this.createLink(switches[s1], switches[s2], 10 + j));
            }
        }

        // Solve it
        const solution = STPSolver.solve(switches, links);

        return {
            id: `gen-${Date.now()}-${index}`,
            name: `Generated Hard #${index + 1}`,
            difficulty: "Hard",
            description: `Procedural Level. ${switchCount} Switches.`,
            switches: switches,
            links: links,
            solution: solution
        };
    },

    createLink: function (s1, s2, idx) {
        const speeds = [
            { cost: 19, name: "Fa" },
            { cost: 4, name: "Gi" },
            { cost: 100, name: "Et" }
        ];
        const r = Math.random();
        let speed = speeds[0];
        if (r > 0.9) speed = speeds[2];
        else if (r > 0.7) speed = speeds[1];

        return {
            source: s1.id,
            target: s2.id,
            cost: speed.cost,
            pSource: `${speed.name}0/${idx + 1}`,
            pTarget: `${speed.name}0/${idx + 1}`
        };
    },

    randomMAC: function () {
        const hex = "0123456789ABCDEF";
        let mac = "0000.";
        for (let i = 0; i < 4; i++) mac += hex[Math.floor(Math.random() * 16)];
        mac += ".";
        for (let i = 0; i < 4; i++) mac += hex[Math.floor(Math.random() * 16)];
        return mac;
    }
};

// Auto-Generate on Load
try {
    const genLevels = LevelGenerator.generate(50);
    TOPOLOGIES.push(...genLevels);
} catch (e) {
    console.error("Generator Error", e);
}

// Start
init();
