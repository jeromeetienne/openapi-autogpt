/**
 * @typedef {object} HNTopicsResult
 * @property {HNTopicsItem[]} topicItems
 */
void(0);

/**
 * @typedef {object} HNTopicsItem
 * @property {string} title
 * @property {string} url
 * @property {number} upVotesCount
 * @property {number} commentsCount
 */
void(0);

/**
 * @typedef {object} HNContentResult
 * @property {string} pageContent
 */
void(0);

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * @typedef {object} GptTaggingResult
 * @property {string} sentiment
 * @property {string} tone
 * @property {string} language
 */
void(0);

/**
 * @typedef {object} GptSummarizationResult
 * @property {string} summary
 */
void(0);

/**
 * @typedef {object} GptNamedEntitiesItem
 * @property {string} personName
 * @property {number} personAge
 * @property {string} personHairColor
 * @property {string} dogName
 * @property {string} dogBreed
void(0);

/**
 * @typedef {GptNamedEntitiesItem[]} GptNamedEntitiesResult
 */
void(0);

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	Export from the module
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

export default {}