import { ExpansionId, Point, toCanvas } from '../data/districts';
import { NPCEntity } from '../types/game';

type Pair = readonly [number, number];
type Outline = readonly Pair[];

export interface DistrictGeometry {
  walk: readonly Outline[];
  solids: readonly Outline[];
  foreground: readonly { front: number; shape: Outline }[];
  landmarks: readonly { name: string; at: Pair; detail: string; refreshment?: boolean }[];
  residents: readonly { sheet: NPCEntity['id']; name: string; role: string; route: readonly Pair[] }[];
}

const box = (left: number, top: number, right: number, bottom: number): Outline =>
  [[left, top], [right, top], [right, bottom], [left, bottom]];

// Footprints, path edges, and occlusion silhouettes use the original-size PNG coordinates.
export const GEOMETRY: Record<ExpansionId, DistrictGeometry> = {
  estate: {
    walk: [
      [[70, 288], [121, 258], [181, 235], [275, 200], [322, 182], [341, 210],
        [410, 192], [496, 225], [506, 288], [633, 316], [637, 351], [532, 328],
        [487, 305], [456, 303], [373, 319], [263, 295], [155, 302], [110, 287], [79, 306]],
      [[340, 213], [356, 178], [390, 160], [412, 178], [450, 192], [494, 212], [494, 259], [381, 247]],
    ],
    solids: [
      box(132, 290, 145, 311), box(184, 268, 198, 285), box(277, 223, 288, 237),
      box(321, 198, 337, 214), box(333, 200, 354, 220), box(356, 196, 383, 218),
      [[414, 201], [466, 200], [479, 232], [456, 244], [420, 245], [412, 226]],
      box(490, 263, 514, 285), box(513, 279, 541, 311),
    ],
    foreground: [
      { front: 280, shape: [[12, 227], [215, 134], [328, 83], [335, 139], [318, 151], [198, 207], [76, 273], [49, 274], [30, 248]] },
      { front: 305, shape: [[511, 131], [536, 148], [541, 299], [530, 307], [511, 299]] },
      { front: 243, shape: [[413, 201], [430, 191], [450, 191], [470, 197], [478, 227], [472, 242], [420, 243], [412, 223]] },
    ],
    landmarks: [
      { name: 'Blocks 261 & 262 linkway', at: [167, 273], detail: 'The covered linkway connects Blk 260 with the lift lobbies at Blocks 261 and 262.' },
      { name: 'Void deck seating', at: [452, 258], detail: 'Residents meet at the mosaic-column void deck, beside the noticeboard and bicycle racks.' },
    ],
    residents: [
      { sheet: 'auntie', name: 'Madam Goh', role: 'Heading home from the market', route: [[226, 274], [305, 241], [388, 270], [445, 290]] },
    ],
  },
  mall: {
    walk: [
      [[13, 247], [83, 228], [151, 166], [172, 138], [218, 125], [283, 167], [363, 207],
        [413, 236], [455, 245], [488, 231], [577, 232], [605, 250], [622, 280], [632, 300],
        [597, 327], [545, 348], [433, 337], [316, 316], [250, 305], [170, 330], [92, 320],
        [46, 290], [15, 268]],
      [[31, 192], [49, 147], [106, 125], [171, 98], [208, 66], [218, 127],
        [175, 155], [121, 178], [64, 208]],
    ],
    solids: [
      [[23, 222], [108, 186], [139, 174], [157, 195], [129, 218], [67, 236], [24, 248]],
      box(46, 183, 57, 200), box(104, 151, 114, 170), box(151, 118, 162, 134),
      box(147, 158, 172, 180), box(404, 223, 427, 242), box(473, 231, 495, 249),
      box(574, 231, 592, 249), box(431, 259, 448, 273), box(465, 277, 481, 292),
      box(514, 288, 529, 303), box(550, 287, 564, 300), box(587, 281, 601, 296),
    ],
    foreground: [
      { front: 188, shape: [[0, 92], [160, 5], [192, 3], [217, 42], [147, 82], [54, 127], [31, 127], [14, 106], [0, 101]] },
      { front: 244, shape: [[23, 219], [117, 173], [141, 178], [153, 194], [144, 215], [121, 220], [28, 246]] },
      { front: 349, shape: [[256, 304], [272, 312], [280, 309], [296, 315], [307, 343], [334, 332], [379, 360], [251, 360]] },
    ],
    landmarks: [
      { name: 'SUNhub covered entrance', at: [534, 242], detail: 'The sheltered SUNhub entrance leads to neighbourhood shops and the supermarket.' },
      { name: 'Bakery and pharmacy', at: [258, 160], detail: 'The bakery and pharmacy share the covered pavement near the bubble tea counter.' },
      { name: 'SUNhub bicycle racks', at: [138, 229], detail: 'Bicycle parking sits beside the sheltered drop-off and bus bay walkway.' },
    ],
    residents: [
      { sheet: 'cashier', name: 'Mr Ong', role: 'Collecting the afternoon delivery', route: [[202, 246], [278, 244], [368, 277], [472, 316]] },
    ],
  },
  market: {
    walk: [
      [[12, 268], [327, 277], [381, 282], [579, 288], [627, 303], [638, 319],
        [540, 329], [397, 352], [238, 340], [110, 347], [34, 327], [17, 310]],
      [[44, 245], [109, 233], [127, 204], [178, 189], [206, 174], [274, 166],
        [313, 151], [365, 149], [371, 225], [365, 282], [42, 273]],
      [[480, 284], [483, 250], [481, 228], [476, 208], [479, 180], [504, 177],
        [517, 198], [515, 227], [521, 248], [557, 272], [565, 292]],
    ],
    solids: [
      box(16, 223, 48, 260), box(78, 210, 111, 238), box(124, 213, 176, 250),
      box(179, 230, 225, 262), box(207, 187, 252, 224), box(227, 216, 287, 257),
      box(263, 178, 311, 212), box(298, 213, 366, 254), box(325, 166, 365, 198),
      box(333, 250, 375, 283), box(374, 258, 391, 285), box(511, 223, 531, 246),
      box(586, 277, 624, 302),
    ],
    foreground: [
      { front: 259, shape: [[179, 222], [205, 218], [223, 226], [223, 253], [209, 260], [181, 256]] },
      { front: 281, shape: [[335, 239], [366, 237], [373, 248], [373, 279], [333, 280]] },
      { front: 298, shape: [[586, 238], [619, 251], [639, 247], [639, 287], [623, 292], [601, 299], [587, 285]] },
    ],
    landmarks: [
      { name: 'Shiok Hawker dining hall', at: [117, 263], detail: 'Chicken rice, economic rice, noodles and kopi share one open dining hall.', refreshment: true },
      { name: 'Tray return station', at: [320, 290], detail: 'Return your tray and crockery before leaving the hawker centre.' },
      { name: 'Sunshine Market', at: [503, 256], detail: 'Fruit and fresh produce line the sheltered Sunshine Market corridor.' },
    ],
    residents: [
      { sheet: 'uncle', name: 'Uncle Chua', role: 'Looking for a seat near the kopi stall', route: [[138, 267], [172, 269], [245, 270], [315, 270]] },
      { sheet: 'auntie', name: 'Madam Lim', role: 'Picking up fruit at Sunshine Market', route: [[497, 211], [501, 241], [503, 268]] },
    ],
  },
  transport: {
    walk: [
      [[39, 295], [57, 260], [115, 264], [173, 286], [174, 308], [361, 309],
        [458, 309], [638, 310], [638, 352], [404, 345], [286, 339], [44, 346]],
      [[370, 311], [376, 260], [387, 228], [455, 228], [451, 263], [453, 312]],
      [[224, 159], [272, 152], [343, 172], [384, 185], [420, 185], [484, 166],
        [557, 123], [634, 77], [638, 112], [560, 161], [496, 205], [471, 234], [383, 238], [221, 199]],
      [[391, 158], [425, 132], [458, 142], [469, 175], [463, 209], [399, 207]],
    ],
    solids: [
      box(174, 300, 367, 308), box(460, 300, 639, 308), box(219, 181, 232, 197),
      box(237, 184, 247, 202), box(276, 196, 289, 213), box(320, 212, 331, 226),
      [[245, 181], [257, 178], [321, 197], [321, 205], [292, 198], [246, 188]],
      box(413, 170, 422, 185), box(443, 171, 451, 185), box(465, 216, 477, 231),
    ],
    foreground: [
      { front: 304, shape: [[175, 284], [366, 284], [366, 307], [175, 307]] },
      { front: 305, shape: [[464, 282], [640, 280], [640, 307], [463, 307]] },
      { front: 219, shape: [[231, 157], [265, 145], [299, 150], [347, 165], [343, 179], [303, 179]] },
    ],
    landmarks: [
      { name: 'Signalised crossing', at: [410, 323], detail: 'Follow the zebra stripes between the tactile paving and the opposite bus bay.' },
      { name: 'Sunshine bus bay', at: [305, 208], detail: 'The sheltered stop serves neighbourhood routes, with the bus bay on the left-hand side of the road.' },
    ],
    residents: [
      { sheet: 'student', name: 'Hui Wen', role: 'Walking towards the sheltered bus bay', route: [[436, 203], [418, 213], [370, 217], [350, 209]] },
    ],
  },
  park: {
    walk: [
      [[5, 311], [81, 312], [231, 312], [385, 305], [610, 307], [638, 298],
        [639, 333], [551, 345], [451, 338], [327, 338], [181, 337], [62, 344], [6, 344]],
      [[126, 309], [209, 294], [261, 271], [305, 239], [297, 223], [250, 198], [208, 174],
        [209, 159], [265, 179], [314, 207], [344, 229], [355, 246], [320, 271], [269, 299], [226, 322]],
      [[266, 167], [365, 115], [396, 115], [418, 124], [321, 168], [300, 185], [274, 179]],
      [[326, 168], [385, 144], [440, 151], [469, 182], [448, 213], [406, 231], [345, 214], [322, 191]],
      [[275, 168], [301, 170], [319, 206], [344, 204], [357, 221], [327, 237], [301, 212]],
      [[341, 316], [356, 299], [368, 276], [387, 282], [376, 308], [360, 327]],
      [[344, 255], [374, 237], [432, 237], [475, 224], [498, 227], [500, 268],
        [471, 282], [434, 301], [367, 293], [346, 274]],
      [[485, 232], [545, 202], [631, 229], [636, 252], [570, 295], [486, 273]],
    ],
    solids: [
      box(338, 188, 354, 197), box(364, 174, 377, 185), box(394, 183, 410, 195),
      box(378, 201, 388, 216), box(399, 196, 416, 211), box(428, 184, 454, 201),
      box(376, 260, 389, 279), box(414, 269, 433, 286), box(445, 259, 458, 275),
      box(459, 251, 474, 270), box(608, 260, 637, 289),
    ],
    foreground: [
      { front: 284, shape: [[374, 230], [427, 205], [472, 222], [471, 246], [459, 255], [459, 267], [451, 274], [444, 252], [429, 257], [428, 283], [415, 284], [415, 259], [387, 250], [387, 273], [379, 268], [379, 248], [374, 243]] },
      { front: 358, shape: [[285, 342], [330, 342], [332, 359], [282, 359]] },
    ],
    landmarks: [
      { name: 'Emerald Dragon Playground', at: [226, 296], detail: 'Mosaic tiles and steel rings form the dragon beside the children’s play area.' },
      { name: 'Senior fitness corner', at: [401, 169], detail: 'The fitness corner is connected to the estate and jogging loop by the red path.' },
      { name: 'Community pavilion', at: [402, 281], detail: 'The open pavilion offers shaded seating next to the park’s multipurpose court.' },
      { name: 'Multipurpose court', at: [559, 249], detail: 'The neighbourhood court is open for casual games.' },
    ],
    residents: [
      { sheet: 'student', name: 'Jia En', role: 'Jogging along the park connector', route: [[97, 318], [182, 317], [241, 302], [285, 275], [325, 246]] },
    ],
  },
};

function contains(poly: Outline, x: number, y: number) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ax, ay] = poly[i];
    const [bx, by] = poly[j];
    if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) inside = !inside;
  }
  return inside;
}

export function expansionWalkable(district: ExpansionId, x: number, y: number) {
  const { walk, solids } = GEOMETRY[district];
  return walk.some((area) => contains(area, x / 2, y / 2))
    && !solids.some((area) => contains(area, x / 2, y / 2));
}

export function expansionForeground(district: ExpansionId) {
  return GEOMETRY[district].foreground.map(({ front, shape }) => ({
    frontY: front * 2,
    outline: shape.map(toCanvas),
  }));
}

export function expansionLandmarks(district: ExpansionId) {
  return GEOMETRY[district].landmarks.map(({ name, at, detail, refreshment }, index) => ({
    ...toCanvas(at), id: `${district}-${index}`, name, detail, refreshment, color: '#d89b52',
  }));
}

export function landmarkNear(district: ExpansionId, point: Point) {
  return expansionLandmarks(district).find((landmark) =>
    Math.hypot(landmark.x - point.x, landmark.y - point.y) < 38);
}
