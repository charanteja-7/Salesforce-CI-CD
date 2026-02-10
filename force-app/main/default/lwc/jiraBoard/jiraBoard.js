import { LightningElement, track, wire } from 'lwc';
import listTickets from '@salesforce/apex/TicketController.listTickets';
import updateStatus from '@salesforce/apex/TicketController.updateStatus';

export default class JiraBoard extends LightningElement {
    @track status = '';
    @track typeVal = '';
    @track myTicketsOnly = true;
    @track tickets = [];
    @track loading = false;
    pageSize = 50;
    pageNumber = 1;

    get statusOptions() {
        return [
            { label: 'All', value: '' },
            { label: 'To Do', value: 'To Do' },
            { label: 'In Progress', value: 'In Progress' },
            { label: 'In Review', value: 'In Review' },
            { label: 'Done', value: 'Done' }
        ];
    }
    get typeOptions() {
        return [
            { label: 'All', value: '' },
            { label: 'Bug', value: 'Bug' },
            { label: 'User Story', value: 'User Story' },
            { label: 'Task', value: 'Task' }
        ];
    }

    connectedCallback() {
        this.refresh();
    }

    async refresh() {
        this.loading = true;
        try {
            const qp = {
                status: this.status,
                typeVal: this.typeVal,
                myTicketsOnly: this.myTicketsOnly,
                pageSize: this.pageSize,
                pageNumber: this.pageNumber
            };
            const data = await listTickets({ qp });
            this.tickets = data || [];
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e);
        } finally {
            this.loading = false;
        }
    }

    handleFilterChange(e) {
        const { name, value, checked, type } = e.target;
        if (name === 'status') this.status = value;
        if (name === 'type') this.typeVal = value;
        if (name === 'mine' && type === 'checkbox') this.myTicketsOnly = checked;
        this.pageNumber = 1;
        this.refresh();
    }

    openCreate() {
        this.template.querySelector('c-ticket-form')?.open();
    }

    handleSaved() {
        this.refresh();
    }

    handleProgressInput(e) {
        const id = e.target.dataset.id;
        const val = e.target.value ? parseInt(e.target.value, 10) : null;
        this.tickets = this.tickets.map(t => (t.id === id ? { ...t, Progress__c: val } : t));
    }

    async changeStatus(e) {
        const { id, status } = e.currentTarget.dataset;
        const t = this.tickets.find(x => x.id === id);
        try {
            await updateStatus({ ticketId: id, newStatus: status, progress: t?.Progress__c });
            this.refresh();
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error(err);
        }
    }

    openEdit(e) {
        const id = e.currentTarget.dataset.id;
        this.template.querySelector('c-ticket-form')?.open(id);
    }

    openLogs(e) {
        const id = e.currentTarget.dataset.id;
        this.template.querySelector('c-work-log-list')?.open(id);
    }
}
