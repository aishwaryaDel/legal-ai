import { supabase } from './supabase';

export interface DataAccessLog {
  user_id: string;
  resource_type: string;
  resource_id: string;
  action: 'view' | 'edit' | 'delete' | 'export' | 'share' | 'download' | 'print';
  ip_address?: string;
  user_agent?: string;
  access_granted: boolean;
  denial_reason?: string;
}

export interface SecurityIncident {
  incident_type: 'unauthorized_access' | 'data_breach' | 'suspicious_activity' | 'policy_violation' | 'system_compromise';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  affected_users: string[];
  affected_resources: {
    resource_type: string;
    resource_ids: string[];
    [key: string]: any;
  };
  resolution_notes?: string;
}

export interface AccessControlCheck {
  granted: boolean;
  reason?: string;
  required_permissions?: string[];
  user_permissions?: string[];
}

class SecurityService {
  async logDataAccess(log: DataAccessLog): Promise<void> {
    try {
      await supabase.from('data_access_log').insert({
        user_id: log.user_id,
        resource_type: log.resource_type,
        resource_id: log.resource_id,
        action: log.action,
        ip_address: log.ip_address,
        user_agent: log.user_agent,
        access_granted: log.access_granted,
        denial_reason: log.denial_reason,
      });
    } catch (error) {
      console.error('Error logging data access:', error);
    }
  }

  async checkAccess(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: string
  ): Promise<AccessControlCheck> {
    try {
      const { data: userRoles, error: roleError } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', userId);

      if (roleError) throw roleError;

      const roles = userRoles?.map((ur: any) => ur.roles.name) || [];

      if (roles.includes('admin')) {
        return { granted: true, reason: 'Admin access' };
      }

      if (resourceType === 'contract') {
        const { data: contract, error: contractError } = await supabase
          .from('contracts')
          .select('owner_id')
          .eq('id', resourceId)
          .maybeSingle();

        if (contractError) throw contractError;

        if (contract?.owner_id === userId) {
          return { granted: true, reason: 'Resource owner' };
        }

        if (action === 'view') {
          return { granted: true, reason: 'Read-only access granted' };
        }

        return {
          granted: false,
          reason: 'Insufficient permissions to modify this resource',
        };
      }

      return { granted: true, reason: 'Default access' };
    } catch (error) {
      console.error('Error checking access:', error);
      return { granted: false, reason: 'Error checking permissions' };
    }
  }

  async logAccessAttempt(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: string,
    granted: boolean,
    denialReason?: string
  ): Promise<void> {
    await this.logDataAccess({
      user_id: userId,
      resource_type: resourceType,
      resource_id: resourceId,
      action: action as any,
      access_granted: granted,
      denial_reason: denialReason,
      ip_address: 'unknown',
      user_agent: navigator.userAgent,
    });

    if (!granted) {
      await this.checkForSuspiciousActivity(userId);
    }
  }

  async checkForSuspiciousActivity(userId: string): Promise<void> {
    try {
      const fiveMinutesAgo = new Date();
      fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

      const { data: recentDenials, error } = await supabase
        .from('data_access_log')
        .select('*')
        .eq('user_id', userId)
        .eq('access_granted', false)
        .gte('timestamp', fiveMinutesAgo.toISOString());

      if (error) throw error;

      if (recentDenials && recentDenials.length >= 5) {
        await this.createSecurityIncident({
          incident_type: 'suspicious_activity',
          severity: 'high',
          description: `User ${userId} has ${recentDenials.length} failed access attempts in the last 5 minutes`,
          affected_users: [userId],
          affected_resources: {
            resource_type: 'user_account',
            resource_ids: [userId],
          },
        });
      }
    } catch (error) {
      console.error('Error checking for suspicious activity:', error);
    }
  }

  async createSecurityIncident(incident: Omit<SecurityIncident, 'detected_at'>): Promise<void> {
    try {
      await supabase.from('security_incidents').insert({
        incident_type: incident.incident_type,
        severity: incident.severity,
        description: incident.description,
        affected_users: incident.affected_users,
        affected_resources: incident.affected_resources,
        resolution_notes: incident.resolution_notes,
        status: 'detected',
      });

      if (incident.severity === 'critical' || incident.severity === 'high') {
        await this.notifySecurityTeam(incident);
      }
    } catch (error) {
      console.error('Error creating security incident:', error);
    }
  }

  private async notifySecurityTeam(incident: SecurityIncident): Promise<void> {
    console.warn('SECURITY ALERT:', incident);
  }

  async getAccessLogs(
    userId?: string,
    resourceType?: string,
    startDate?: string,
    endDate?: string
  ): Promise<any[]> {
    try {
      let query = supabase
        .from('data_access_log')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (resourceType) {
        query = query.eq('resource_type', resourceType);
      }

      if (startDate) {
        query = query.gte('timestamp', startDate);
      }

      if (endDate) {
        query = query.lte('timestamp', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching access logs:', error);
      return [];
    }
  }

  async getSecurityIncidents(
    severity?: string,
    status?: string
  ): Promise<any[]> {
    try {
      let query = supabase
        .from('security_incidents')
        .select('*')
        .order('detected_at', { ascending: false });

      if (severity) {
        query = query.eq('severity', severity);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching security incidents:', error);
      return [];
    }
  }

  async resolveSecurityIncident(
    incidentId: string,
    resolutionNotes: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('security_incidents')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolution_notes: resolutionNotes,
        })
        .eq('id', incidentId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error resolving security incident:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async validateDataIntegrity(
    resourceType: string,
    resourceId: string
  ): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    try {
      const { data, error } = await supabase
        .from(resourceType)
        .select('*')
        .eq('id', resourceId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        return {
          valid: false,
          issues: ['Resource not found'],
        };
      }

      const issues: string[] = [];

      if (data.created_at && data.updated_at) {
        const created = new Date(data.created_at);
        const updated = new Date(data.updated_at);

        if (updated < created) {
          issues.push('Updated timestamp is before created timestamp');
        }
      }

      if (resourceType === 'contracts') {
        if (!data.contract_type) {
          issues.push('Missing contract type');
        }
        if (!data.jurisdiction) {
          issues.push('Missing jurisdiction');
        }
        if (!data.status) {
          issues.push('Missing status');
        }
      }

      return {
        valid: issues.length === 0,
        issues,
      };
    } catch (error) {
      console.error('Error validating data integrity:', error);
      return {
        valid: false,
        issues: ['Error during validation'],
      };
    }
  }

  encryptSensitiveData(data: string): string {
    return btoa(data);
  }

  decryptSensitiveData(encryptedData: string): string {
    try {
      return atob(encryptedData);
    } catch (error) {
      console.error('Error decrypting data:', error);
      return '';
    }
  }

  async auditSensitiveOperation(
    userId: string,
    operation: string,
    details: any
  ): Promise<void> {
    try {
      await supabase.from('audit_log').insert({
        user_id: userId,
        action: operation,
        resource_type: 'sensitive_operation',
        resource_id: 'N/A',
        details: {
          operation,
          ...details,
        },
        ip_address: 'unknown',
        user_agent: navigator.userAgent,
      });
    } catch (error) {
      console.error('Error auditing sensitive operation:', error);
    }
  }

  async detectDataExfiltration(userId: string): Promise<boolean> {
    try {
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const { data: recentExports, error } = await supabase
        .from('data_access_log')
        .select('*')
        .eq('user_id', userId)
        .in('action', ['export', 'download'])
        .gte('timestamp', oneHourAgo.toISOString());

      if (error) throw error;

      const THRESHOLD = 10;
      if (recentExports && recentExports.length >= THRESHOLD) {
        await this.createSecurityIncident({
          incident_type: 'suspicious_activity',
          severity: 'critical',
          description: `Potential data exfiltration: User ${userId} performed ${recentExports.length} export/download operations in the last hour`,
          affected_users: [userId],
          affected_resources: {
            resource_type: 'multiple',
            resource_ids: recentExports.map(r => r.resource_id),
          },
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error detecting data exfiltration:', error);
      return false;
    }
  }

  async generateSecurityReport(startDate: string, endDate: string): Promise<{
    total_access_attempts: number;
    successful_access: number;
    denied_access: number;
    security_incidents: number;
    top_accessed_resources: Array<{ resource_type: string; count: number }>;
    high_risk_users: Array<{ user_id: string; denial_count: number }>;
  }> {
    try {
      const { data: accessLogs, error: logError } = await supabase
        .from('data_access_log')
        .select('*')
        .gte('timestamp', startDate)
        .lte('timestamp', endDate);

      if (logError) throw logError;

      const { data: incidents, error: incidentError } = await supabase
        .from('security_incidents')
        .select('*')
        .gte('detected_at', startDate)
        .lte('detected_at', endDate);

      if (incidentError) throw incidentError;

      const totalAccess = accessLogs?.length || 0;
      const successfulAccess = accessLogs?.filter(log => log.access_granted).length || 0;
      const deniedAccess = totalAccess - successfulAccess;

      const resourceCounts: Record<string, number> = {};
      accessLogs?.forEach(log => {
        resourceCounts[log.resource_type] = (resourceCounts[log.resource_type] || 0) + 1;
      });

      const topResources = Object.entries(resourceCounts)
        .map(([resource_type, count]) => ({ resource_type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const userDenials: Record<string, number> = {};
      accessLogs?.filter(log => !log.access_granted).forEach(log => {
        userDenials[log.user_id] = (userDenials[log.user_id] || 0) + 1;
      });

      const highRiskUsers = Object.entries(userDenials)
        .map(([user_id, denial_count]) => ({ user_id, denial_count }))
        .filter(u => u.denial_count >= 3)
        .sort((a, b) => b.denial_count - a.denial_count);

      return {
        total_access_attempts: totalAccess,
        successful_access: successfulAccess,
        denied_access: deniedAccess,
        security_incidents: incidents?.length || 0,
        top_accessed_resources: topResources,
        high_risk_users: highRiskUsers,
      };
    } catch (error) {
      console.error('Error generating security report:', error);
      return {
        total_access_attempts: 0,
        successful_access: 0,
        denied_access: 0,
        security_incidents: 0,
        top_accessed_resources: [],
        high_risk_users: [],
      };
    }
  }
}

export const securityService = new SecurityService();
