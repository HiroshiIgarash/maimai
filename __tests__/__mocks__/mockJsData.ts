// モック用の外部JSファイルデータ
export const mockMaimaiScriptText = `
var test=""
const mlist_length=1406;
const update_mlist = "2025.08.22";

const lv15_rslt = [
[
"<span class='wk_r'>PANDORA PARADOXXX</span>",
"<span class='wk_r'>系ぎて[dx]</span>", 
"<span class='wk_r_n'>Xaleid◆scopiX[dx]</span>",
"<span class='wk_m'>World's end BLACKBOX</span>",
"<span class='wk_m_n'>宙天[dx]</span>",
"<span class='wk_e'>QZKago Requiem</span>",
"<span class='wk_e_n'>Sample Song[dx]</span>"
]
];

const lv14_rslt = [
[
"<span class='wk_r'>Level 14.9 Song</span>",
"<span class='wk_m_n'>14.9 New Song[dx]</span>"
],
[
"<span class='wk_e'>Level 14.8 Song</span>",
"<span class='wk_r_n'>14.8 New[dx]</span>"
],
[
"<span class='wk_m'>Level 14.7 Song</span>"
],
[
"<span class='wk_e_n'>Level 14.6 Song[dx]</span>"
],
[
"<span class='wk_r'>Level 14.5 Song</span>"
],
[
"<span class='wk_m_n'>Level 14.4 Song[dx]</span>"
],
[
"<span class='wk_e'>Level 14.3 Song</span>"
],
[
"<span class='wk_r_n'>Level 14.2 Song[dx]</span>"
],
[
"<span class='wk_m'>Level 14.1 Song</span>"
],
[
"<span class='wk_e_n'>Level 14.0 Song[dx]</span>"
]
];

const lv13_rslt = [
[
"<span class='wk_m'>Level 13.0 Song</span>"
]
];

// 他のレベル配列は空にしておく
const lv12_rslt = [];
const lv11_rslt = [];
const lv10_rslt = [];
const lv9_rslt = [];
const lv8_rslt = [];
const lv7_rslt = [];
const lv6_rslt = [];
const lv5_rslt = [];
`;

// 期待される結果データ
// ユーザーの指定: lv15_rslt は1配列(15.0)、lv14_rslt は10配列で14.9,14.8,14.7...14.0
export const expectedMusicData = {
  r: [
    // lv15_rslt[0] -> 15.0
    { title: "PANDORA PARADOXXX", level: 15.0, isDx: false, isNew: false },
    { title: "系ぎて", level: 15.0, isDx: true, isNew: false },
    { title: "Xaleid◆scopiX", level: 15.0, isDx: true, isNew: true },
    // lv14_rslt[0] -> 14.9
    { title: "Level 14.9 Song", level: 14.9, isDx: false, isNew: false },
    // lv14_rslt[1] -> 14.8
    { title: "14.8 New", level: 14.8, isDx: true, isNew: true },
    // lv14_rslt[4] -> 14.5
    { title: "Level 14.5 Song", level: 14.5, isDx: false, isNew: false },
    // lv14_rslt[7] -> 14.2
    { title: "Level 14.2 Song", level: 14.2, isDx: true, isNew: true },
  ],
  m: [
    // lv15_rslt[0] -> 15.0
    { title: "World's end BLACKBOX", level: 15.0, isDx: false, isNew: false },
    { title: "宙天", level: 15.0, isDx: true, isNew: true },
    // lv14_rslt[0] -> 14.9
    { title: "14.9 New Song", level: 14.9, isDx: true, isNew: true },
    // lv14_rslt[2] -> 14.7
    { title: "Level 14.7 Song", level: 14.7, isDx: false, isNew: false },
    // lv14_rslt[5] -> 14.4
    { title: "Level 14.4 Song", level: 14.4, isDx: true, isNew: true },
    // lv14_rslt[8] -> 14.1
    { title: "Level 14.1 Song", level: 14.1, isDx: false, isNew: false },
    // lv13_rslt[0] -> 13.0
    { title: "Level 13.0 Song", level: 13.0, isDx: false, isNew: false },
  ],
  e: [
    // lv15_rslt[0] -> 15.0
    { title: "QZKago Requiem", level: 15.0, isDx: false, isNew: false },
    { title: "Sample Song", level: 15.0, isDx: true, isNew: true },
    // lv14_rslt[1] -> 14.8
    { title: "Level 14.8 Song", level: 14.8, isDx: false, isNew: false },
    // lv14_rslt[3] -> 14.6
    { title: "Level 14.6 Song", level: 14.6, isDx: true, isNew: true },
    // lv14_rslt[6] -> 14.3
    { title: "Level 14.3 Song", level: 14.3, isDx: false, isNew: false },
    // lv14_rslt[9] -> 14.0
    { title: "Level 14.0 Song", level: 14.0, isDx: true, isNew: true },
  ],
};

// エッジケース用のモックデータ
export const mockEdgeCaseScriptText = `
const lv15_rslt = [
[
"<span class='wk_r'>楽曲名に◆記号が入る楽曲</span>",
"<span class='wk_invalid'>無効なクラス名</span>",
"<span class='wk_m'>楽曲名に[dx]が含まれる楽曲[dx][dx]</span>",
"<span>クラス名なし</span>",
"",
"<span class='wk_e_n_extra'>長いクラス名_n</span>"
]
];

const lv14_rslt = [];
const lv13_rslt = [];
const lv12_rslt = [];
const lv11_rslt = [];
const lv10_rslt = [];
const lv9_rslt = [];
const lv8_rslt = [];
const lv7_rslt = [];
const lv6_rslt = [];
const lv5_rslt = [];
`;

export const expectedEdgeCaseData = {
  r: [
    { title: "楽曲名に◆記号が入る楽曲", level: 15.0, isDx: false, isNew: false },
  ],
  m: [
    { title: "楽曲名に[dx]が含まれる楽曲[dx]", level: 15.0, isDx: true, isNew: false },
  ],
  e: [
    { title: "長いクラス名", level: 15.0, isDx: false, isNew: true },
  ],
};