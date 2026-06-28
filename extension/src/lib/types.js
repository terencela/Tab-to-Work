/**
 * @typedef {Object} Goal
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {boolean} active
 * @property {boolean} [primary]
 */

/**
 * @typedef {Object} TabCapture
 * @property {number} tabId
 * @property {string} url
 * @property {string} title
 * @property {string} [favIconUrl]
 * @property {string} excerpt
 * @property {number} wordCount
 * @property {string} [goalId]
 * @property {number} [goalConfidence]
 * @property {string} [goalName]
 */

/**
 * @typedef {Object} Session
 * @property {string} id
 * @property {string} title
 * @property {string} createdAt
 * @property {TabCapture[]} tabs
 * @property {string} summary
 * @property {Record<string, number>} goalBreakdown
 */

/**
 * @typedef {Object} Settings
 * @property {boolean} closeAfterSave
 * @property {boolean} allWindows
 */

export const DEFAULT_GOALS = [
  {
    id: "goal-travel",
    name: "Travel planning",
    description: "hotels flights trips booking vacation",
    active: true,
    primary: true,
  },
  {
    id: "goal-work",
    name: "Work project",
    description: "client deck procurement vendor docs notion github",
    active: true,
  },
  {
    id: "goal-research",
    name: "Research",
    description: "articles papers learning reddit youtube docs",
    active: true,
  },
];

export const DEFAULT_SETTINGS = {
  closeAfterSave: false,
  allWindows: false,
};
