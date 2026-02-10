import { LightningElement, track, api } from 'lwc';
import getWorkLogs from '@salesforce/apex/TicketController.getWorkLogs';
import addWorkLog from '@salesforce/apex/TicketController.addWorkLog';

export default class WorkLogList extends LightningElement {
    @track openModal = false;
    @track ticketId;
    @track logs = [];
    @track loading = false;

    // New log fields
    @track wlStartedAt;
    @track wlMinutes;
    @track wlComment = '';

    @api open(id) {
        this.ticketId = id;
        this.resetForm();
        this.openModal = true;
        this.loadLogs();
    }

    close() {
        this.openModal = false;
    }

    resetForm() {
        this.wlStartedAt = undefined;
        this.wlMinutes = undefined;
        this.wlComment = '';
    }

    async loadLogs() {
        if (!this.ticketId) return;
        this.loading = true;
        try {
            const data = await getWorkLogs({ ticketId: this.ticketId });
            this.logs = data || [];
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e);
        } finally {
            this.loading = false;
        }
    }

    handleChange(e) {
        const { name, value } = e.target;
        if (name === 'startedAt') this.wlStartedAt = value;
        if (name === 'minutes') this.wlMinutes = value ? parseInt(value, 10) : undefined;
        if (name === 'comment') this.wlComment = value;
    }

    async addLog() {
        if (!this.ticketId || !this.wlMinutes) {
            // basic client validation
            return;
        }
        const rec = {
            sobjectType: 'WorkLog__c',
            Ticket__c: this.ticketId,
            StartedAt__c: this.wlStartedAt ? new Date(this.wlStartedAt).toISOString() : null,
            TimeSpentMinutes__c: this.wlMinutes,
            Comment__c: this.wlComment || null
        };
        try {
            await addWorkLog({ input: rec });
            this.resetForm();
            await this.loadLogs();
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e);
        }
    }
}
