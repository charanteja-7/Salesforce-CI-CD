import { LightningElement, api, track } from 'lwc';
import upsertTicket from '@salesforce/apex/TicketController.upsertTicket';

export default class TicketForm extends LightningElement {
    @track recordId;
    @track openModal = false;

    @track typeVal = 'Task';
    @track statusVal = 'To Do';
    @track description = '';
    @track startedAt; // ISO string
    @track assigneeId = null;
    @track progress = 0;

    get typeOptions() {
        return [
            { label: 'Bug', value: 'Bug' },
            { label: 'User Story', value: 'User Story' },
            { label: 'Task', value: 'Task' }
        ];
    }
    get statusOptions() {
        return [
            { label: 'To Do', value: 'To Do' },
            { label: 'In Progress', value: 'In Progress' },
            { label: 'In Review', value: 'In Review' },
            { label: 'Done', value: 'Done' }
        ];
    }

    @api open(id) {
        this.reset();
        this.openModal = true;
        if (id) {
            this.recordId = id;
            // When editing, allow parent to prefill via public method
            // or we could fire an event to request details if needed.
        }
    }
    close() {
        this.openModal = false;
    }
    reset() {
        this.recordId = undefined;
        this.typeVal = 'Task';
        this.statusVal = 'To Do';
        this.description = '';
        this.startedAt = undefined;
        this.assigneeId = null;
        this.progress = 0;
    }

    handleChange(e) {
        const { name, value } = e.target;
        if (name === 'type') this.typeVal = value;
        if (name === 'status') this.statusVal = value;
        if (name === 'desc') this.description = value;
        if (name === 'startedAt') this.startedAt = value;
        if (name === 'assignee') this.assigneeId = value;
        if (name === 'progress') this.progress = value ? parseInt(value, 10) : 0;
    }

    async handleSave() {
        const rec = {
            sobjectType: 'Ticket__c',
            Id: this.recordId,
            Type__c: this.typeVal,
            Status__c: this.statusVal,
            Description__c: this.description,
            StartedAt__c: this.startedAt ? new Date(this.startedAt).toISOString() : null,
            Assignee__c: this.assigneeId || null,
            Progress__c: this.progress
        };
        try {
            await upsertTicket({ input: rec });
            this.close();
            this.dispatchEvent(new CustomEvent('saved'));
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e);
        }
    }
}
