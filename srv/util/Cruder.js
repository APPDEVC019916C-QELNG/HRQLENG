class Cruder {

    constructor(service) {
        this.service = service;
    };

    /**
 * Deletes records from the specified entity.
    * @param {string} entityName - The name of the entity.
    * @param {Array} where - The conditions for deleting records.
    * @param {string} logical - The logical operator for combining conditions.
    * @returns {Object} - The DELETE query object.
    */
    delete = (entityName, where, logical) => {
        return DELETE(this.service.entities[entityName].name).where(this._getConditionWhere(where, logical));
    };
  
    /**
     * Updates records in the specified entity.
     * @param {string} entityName - The name of the entity.
     * @param {Object} entries - The entries to be updated.
     * @param {Array} where - The conditions for updating records.
     * @param {string} logical - The logical operator for combining conditions.
     * @returns {Object} - The UPDATE query object.
     */
    update = (entityName, entries, where,logical) => {
        return UPDATE(this.service.entities[entityName].name).set(entries).where(this._getConditionWhere(where, logical));
    };

    /**
     * Creates a new record in the specified entity.
     * @param {string} entityName - The name of the entity.
     * @param {Object} entries - The entries for creating a new record.
     * @returns {Object} - The INSERT query object.
     */
    create = (entityName, entries) => {
        return INSERT.into(this.service.entities[entityName].name).entries(entries);
    };

    /**
     * Reads a single record from the specified entity.
     * @param {string} entityName - The name of the entity.
     * @param {Array} where - The conditions for reading the record.
     * @param {string} logical - The logical operator for combining conditions.
     * @param {Array} sort - The sorting criteria for the records.
     * @param {Array} columns - The columns to be retrieved.
     * @param {boolean} dontConvertWhere - Flag indicating whether to convert the 'where' conditions.
     * @returns {Object} - The SELECT query object.
     */
    readOne = (entityName, where, logical, sort, columns, dontConvertWhere) => {
        return this._read(true, this.service.entities[entityName].name, where, logical, sort, columns, dontConvertWhere);
    };
    
    /**
     * Reads data from the specified entity using the given parameters.
     * @param {string} entityName - The name of the entity to read from.
     * @param {Array} where - The conditions to filter the data by.
     * @param {string} logical - The logical operator to use for combining multiple conditions.
     * @param {Array} sort - The sorting criteria for the data.
     * @param {Array} columns - The columns to include in the result.
     * @param {boolean} dontConvertWhere - Indicates whether the where conditions should be converted.
     * @returns {Object} - The query object for reading the data.
     */
    read = (entityName, where, logical, sort, columns, dontConvertWhere) => {
        return this._read(false, this.service.entities[entityName].name, where, logical, sort, columns, dontConvertWhere);
    };

    /**
     * 
     *********************** Private Methods ****************************
    */

    /**
     * Reads data from the specified entity using the given parameters.
     * @private
     * @param {boolean} one - Indicates whether to return only one record.
     * @param {string} entityName - The name of the entity to read from.
     * @param {Array} where - The conditions to filter the data by.
     * @param {string} logical - The logical operator to use for combining multiple conditions.
     * @param {Array} sort - The sorting criteria for the data.
     * @param {Array} columns - The columns to include in the result.
     * @param {boolean} dontConvertWhere - Indicates whether the where conditions should be converted.
     * @returns {Object} - The query object for reading the data.
     */
    _read = (one, entityName, where, logical, sort, columns, dontConvertWhere) => {
        let query = one ? SELECT.one(entityName) : SELECT.from(entityName);
        if (columns) {
            query = query.columns(columns);
        }
        if (where) {
            query = query.where(this._getConditionWhere(where, logical,dontConvertWhere))
        }
        if (sort) {
            query = query.orderBy(this._getSort(sort));
        }

        return query;
    };

    /**
     * Converts the given "where" array into the JSDOCS format.
     *
     * @param {Array} where - The "where" array to be converted.
     * @param {string} logical - The logical operator to be used between conditions.
     * @param {boolean} dontConvertWhere - Flag to indicate whether to convert "where" or not.
     * @returns {Array} - The converted "where" array in JSDOCS format.
     */
    _getConditionWhere = (where, logical,dontConvertWhere) => {
        let returnValue = [];

        if (dontConvertWhere) {
            returnValue = where;
        }
        else {
            where.forEach((element, index, array) => {
                returnValue.push({ ref: [element[0]] });
                returnValue.push(element[1]);
                returnValue.push({ val: element[2] })
                if (logical && index !== array.length - 1) {
                    returnValue.push(logical);
                }
            });
        }
        return returnValue;
    };

    /**
     * Converts the given "sort" array into the  CAP Format.
     *
     * @param {Array} sort - The "sort" array to be converted.
     * @returns {Array} - The converted "sort" array in CAP Format.
     */
    _getSort = (sort) => {
        const returnValue = [];
        sort.forEach((element) => {
            returnValue.push({ ref: [element[0]], sort: element[1] });
        });
        return returnValue;
    };

};
module.exports = Cruder;