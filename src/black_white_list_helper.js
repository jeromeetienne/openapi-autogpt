import GlobRex from 'globrex'

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	jsdoc
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * @typedef {string} BlackWhiteListItem - a glob pattern
 * 
 */
void (0)

/**
 * @typedef {BlackWhiteListItem[]} BlackWhiteList
 * 
 */
void (0)


///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


export default class BlackWhiteListHelper {

        /**
         * NOTE: if the whiteList is empty, everything is allowed
         * 
         * @param {string} inputValue
         * @param {BlackWhiteList} whiteGlobList 
         * @param {BlackWhiteList} blackGlobList 
         */
        static async filter(inputValue, whiteGlobList, blackGlobList ) {
                // if whiteList is empty, everything is allowed
                if (whiteGlobList.length === 0) {
                        whiteGlobList = ['*']
                }

                // honor blackList
                for(const globItem of blackGlobList){
                        const globResult = GlobRex(globItem, {extended: true})
                        if( globResult.regex.test(inputValue) === true ){
                                // reject this url
                                return false
                        }
                }

                // honor whiteList
                for(const globItem of whiteGlobList){
                        const globResult = GlobRex(globItem, {extended: true})
                        if( globResult.regex.test(inputValue) === true ){
                                // accept this url
                                return true
                        }
                }

                // reject this url
                return false
        }
}