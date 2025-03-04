const queryBuilder = require('../util/QueryBuilder');
class EmployeeJobHandler {

    constructor() {
        this.queryBuilder = new queryBuilder();
    }

    getFilteredEmployeeListQuery = async (oPayload) => {
        const aFilters = await this.createFilterForEmployeeList(oPayload);

        return this.queryBuilder.buildEmployeeFilterQuery(aFilters);
    }

    createFilterForEmployeeList = async (oPayload) => {
        return new Promise(resolve => {
            let oFilter = [];

            if (oPayload.userIds && oPayload.userIds.length) {
                oFilter = [...oFilter, oPayload.userIds.map(item => { return { "userId": item } })];
            }

            if (oPayload.foJobs && oPayload.foJobs.length) {
                oFilter = [...oFilter, oPayload.foJobs.map(item => { return { "jobCode": item.externalCode } })];
            }

            if (oPayload.departments && oPayload.departments.length) {
                oFilter = [...oFilter, oPayload.departments.map(item => { return { "customString3": item.externalCode } })];
            }

            if (oPayload.groups && oPayload.groups.length) {
                oFilter = [...oFilter, oPayload.groups.map(item => { return { "customString2": item.externalCode } })];
            }

            if (oPayload.orgUnits && oPayload.orgUnits.length) {
                oFilter = [...oFilter, oPayload.orgUnits.map(item => { return { "department": item.externalCode } })];
            }

            if (oPayload.hrPersonnelAreas && oPayload.hrPersonnelAreas.length) {
                oFilter = [...oFilter, oPayload.hrPersonnelAreas.map(item => { return { "customString8": item.externalCode } })];
            }

            if (oPayload.custEmployeeGroups && oPayload.custEmployeeGroups.length) {
                oFilter = [...oFilter, oPayload.custEmployeeGroups.map(item => { return { "customString10": item.externalCode } })];
            }

            resolve(oFilter);
        });
    }

}

module.exports = EmployeeJobHandler;