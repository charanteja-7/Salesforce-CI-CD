public with sharing class TicketController {
    public class TicketDTO {
        @AuraEnabled public Id id;
        @AuraEnabled public String name;
        @AuraEnabled public String type;
        @AuraEnabled public String status;
        @AuraEnabled public String description;
        @AuraEnabled public Datetime startedAt;
        @AuraEnabled public Id assigneeId;
        @AuraEnabled public Decimal progress;
        @AuraEnabled public String assigneeName;
    }
    public class WorkLogDTO {
        @AuraEnabled public Id id;
        @AuraEnabled public Id ticketId;
        @AuraEnabled public Datetime startedAt;
        @AuraEnabled public Integer timeSpentMinutes;
        @AuraEnabled public String comment;
        @AuraEnabled public Datetime createdDate;
        @AuraEnabled public String createdByName;
    }

    // Query params
    public class QueryParams {
        @AuraEnabled public String status; // optional
        @AuraEnabled public String typeVal; // optional
        @AuraEnabled public Boolean myTicketsOnly; // optional
        @AuraEnabled public Integer pageSize;
        @AuraEnabled public Integer pageNumber;
    }

    @AuraEnabled(cacheable=true)
    public static List<TicketDTO> listTickets(QueryParams qp) {
        Integer size = qp != null && qp.pageSize != null && qp.pageSize > 0 ? qp.pageSize : 50;
        Integer page = qp != null && qp.pageNumber != null && qp.pageNumber > 0 ? qp.pageNumber : 1;
        Integer offsetRows = (page - 1) * size;

        String soql = 'SELECT Id, Name, Type__c, Status__c, Description__c, StartedAt__c, Assignee__c, Progress__c, ' +
                      'Assignee__r.Name ' +
                      'FROM Ticket__c';
        List<String> wheres = new List<String>();
        if (qp != null) {
            if (String.isNotBlank(qp.status)) {
                wheres.add('Status__c = :qp.status');
            }
            if (String.isNotBlank(qp.typeVal)) {
                wheres.add('Type__c = :qp.typeVal');
            }
            if (qp.myTicketsOnly == true) {
                wheres.add('Assignee__c = :UserInfo.getUserId()');
            }
        }
        if (!wheres.isEmpty()) {
            soql += ' WHERE ' + String.join(wheres, ' AND ');
        }
        soql += ' ORDER BY CreatedDate DESC LIMIT :size OFFSET :offsetRows';

        List<Ticket__c> rows = Database.query(soql);
        List<TicketDTO> result = new List<TicketDTO>();
        for (Ticket__c t : rows) {
            TicketDTO d = new TicketDTO();
            d.id = t.Id;
            d.name = t.Name;
            d.type = t.Type__c;
            d.status = t.Status__c;
            d.description = t.Description__c;
            d.startedAt = t.StartedAt__c;
            d.assigneeId = t.Assignee__c;
            d.progress = t.Progress__c;
            d.assigneeName = (t.Assignee__r != null ? t.Assignee__r.Name : null);
            result.add(d);
        }
        return result;
    }

    @AuraEnabled
    public static Id upsertTicket(Ticket__c input) {
        // Minimal validation
        if (String.isBlank(input.Type__c)) {
            input.Type__c = 'Task';
        }
        if (String.isBlank(input.Status__c)) {
            input.Status__c = 'To Do';
        }
        upsert input;
        return input.Id;
    }

    @AuraEnabled
    public static void updateStatus(Id ticketId, String newStatus, Decimal progress) {
        if (ticketId == null) throw new AuraHandledException('ticketId required');
        Ticket__c t = new Ticket__c(Id = ticketId, Status__c = newStatus);
        if (progress != null) {
            t.Progress__c = progress;
        }
        update t;
    }

    @AuraEnabled(cacheable=true)
    public static List<WorkLogDTO> getWorkLogs(Id ticketId) {
        if (ticketId == null) return new List<WorkLogDTO>();
        List<WorkLog__c> logs = [
            SELECT Id, Ticket__c, StartedAt__c, TimeSpentMinutes__c, Comment__c, CreatedDate, CreatedBy.Name
            FROM WorkLog__c
            WHERE Ticket__c = :ticketId
            ORDER BY StartedAt__c DESC, CreatedDate DESC
        ];
        List<WorkLogDTO> out = new List<WorkLogDTO>();
        for (WorkLog__c wl : logs) {
            WorkLogDTO d = new WorkLogDTO();
            d.id = wl.Id;
            d.ticketId = wl.Ticket__c;
            d.startedAt = wl.StartedAt__c;
            d.timeSpentMinutes = (Integer)wl.TimeSpentMinutes__c;
            d.comment = wl.Comment__c;
            d.createdDate = wl.CreatedDate;
            d.createdByName = wl.CreatedBy != null ? wl.CreatedBy.Name : null;
            out.add(d);
        }
        return out;
    }

    @AuraEnabled
    public static Id addWorkLog(WorkLog__c input) {
        if (input == null || input.Ticket__c == null) {
            throw new AuraHandledException('Ticket__c is required on WorkLog');
        }
        insert input;
        return input.Id;
    }
}
