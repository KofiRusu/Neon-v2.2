"use client";

import { useState } from "react";
import RoleBadge from "../../components/RoleBadge";
import InviteModal from "../../components/InviteModal";
import {
  UserGroupIcon,
  PlusIcon,
  CogIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EllipsisVerticalIcon,
  UserPlusIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "admin" | "editor" | "viewer" | "member";
  status: "active" | "pending" | "inactive";
  avatar?: string;
  joinedAt: Date;
  lastActive: Date;
  invitedBy?: string;
}

interface PendingInvite {
  id: string;
  email: string;
  role: "admin" | "editor" | "viewer" | "member";
  invitedBy: string;
  invitedAt: Date;
  expiresAt: Date;
}

export default function TeamPage(): JSX.Element {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showMemberActions, setShowMemberActions] = useState<string | null>(
    null,
  );

  // Mock team data
  const teamMembers: TeamMember[] = [
    {
      id: "1",
      name: "John Doe",
      email: "john@company.com",
      role: "admin",
      status: "active",
      avatar: undefined,
      joinedAt: new Date("2024-01-01"),
      lastActive: new Date("2024-01-21T10:30:00"),
    },
    {
      id: "2",
      name: "Sarah Chen",
      email: "sarah@company.com",
      role: "editor",
      status: "active",
      avatar: undefined,
      joinedAt: new Date("2024-01-15"),
      lastActive: new Date("2024-01-21T09:15:00"),
      invitedBy: "John Doe",
    },
    {
      id: "3",
      name: "Mike Johnson",
      email: "mike@company.com",
      role: "viewer",
      status: "active",
      avatar: undefined,
      joinedAt: new Date("2024-01-18"),
      lastActive: new Date("2024-01-20T16:45:00"),
      invitedBy: "John Doe",
    },
    {
      id: "4",
      name: "Emily Rodriguez",
      email: "emily@company.com",
      role: "editor",
      status: "inactive",
      avatar: undefined,
      joinedAt: new Date("2024-01-10"),
      lastActive: new Date("2024-01-18T14:20:00"),
      invitedBy: "John Doe",
    },
  ];

  const pendingInvites: PendingInvite[] = [
    {
      id: "1",
      email: "alex@company.com",
      role: "viewer",
      invitedBy: "John Doe",
      invitedAt: new Date("2024-01-20"),
      expiresAt: new Date("2024-01-27"),
    },
    {
      id: "2",
      email: "maria@company.com",
      role: "editor",
      invitedBy: "Sarah Chen",
      invitedAt: new Date("2024-01-19"),
      expiresAt: new Date("2024-01-26"),
    },
  ];

  const handleInviteMember = async (email: string, role: string) => {
    // Mock invitation process
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log("Inviting member:", { email, role });
    // In real implementation, this would call an API to send the invitation
  };

  const handleRemoveMember = (memberId: string) => {
    console.log("Removing member:", memberId);
    // In real implementation, this would call an API to remove the member
  };

  const handleUpdateRole = (memberId: string, newRole: string) => {
    console.log("Updating role:", { memberId, newRole });
    // In real implementation, this would call an API to update the member's role
  };

  const handleResendInvite = (inviteId: string) => {
    console.log("Resending invite:", inviteId);
    // In real implementation, this would call an API to resend the invitation
  };

  const handleCancelInvite = (inviteId: string) => {
    console.log("Canceling invite:", inviteId);
    // In real implementation, this would call an API to cancel the invitation
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-neon-green";
      case "pending":
        return "text-yellow-400";
      case "inactive":
        return "text-gray-400";
      default:
        return "text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircleIcon className="h-4 w-4" />;
      case "pending":
        return <ClockIcon className="h-4 w-4" />;
      case "inactive":
        return <XCircleIcon className="h-4 w-4" />;
      default:
        return <XCircleIcon className="h-4 w-4" />;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatLastActive = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? "s" : ""} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else {
      return "Just now";
    }
  };

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-4xl font-bold">
                <span className="text-neon-purple">Team</span>
                <span className="text-primary"> Management</span>
              </h1>
              <div className="bg-neon-blue/20 text-neon-blue border border-neon-blue/30 px-3 py-1 rounded-full text-sm font-semibold">
                BETA
              </div>
            </div>
            <p className="text-secondary text-lg">
              Manage team members, roles, and access permissions
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowInviteModal(true)}
              className="btn-neon"
            >
              <UserPlusIcon className="h-5 w-5 mr-2" />
              Invite Member
            </button>
          </div>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-neon-purple rounded-xl flex items-center justify-center">
                <UserGroupIcon className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-xs text-secondary">Total Members</div>
                <div className="stat-number text-neon-purple">
                  {teamMembers.length}
                </div>
                <div className="text-xs text-muted">+2 this month</div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-neon-green rounded-xl flex items-center justify-center">
                <CheckCircleIcon className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-xs text-secondary">Active Members</div>
                <div className="stat-number text-neon-green">
                  {teamMembers.filter((m) => m.status === "active").length}
                </div>
                <div className="text-xs text-muted">Online now</div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-xs text-secondary">Pending Invites</div>
                <div className="stat-number text-yellow-400">
                  {pendingInvites.length}
                </div>
                <div className="text-xs text-muted">Awaiting response</div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-neon-blue rounded-xl flex items-center justify-center">
                <ShieldCheckIcon className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-xs text-secondary">Admins</div>
                <div className="stat-number text-neon-blue">
                  {teamMembers.filter((m) => m.role === "admin").length}
                </div>
                <div className="text-xs text-muted">Full access</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div className="space-y-8">
        <div className="glass-strong p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-primary">Team Members</h2>
            <div className="text-sm text-secondary">
              {teamMembers.length} member{teamMembers.length !== 1 ? "s" : ""}
            </div>
          </div>

          <div className="space-y-4">
            {teamMembers.map((member) => (
              <div key={member.id} className="glass p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full flex items-center justify-center text-white font-bold">
                      {getInitials(member.name)}
                    </div>

                    {/* Member Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="font-semibold text-primary">
                          {member.name}
                        </h3>
                        <RoleBadge role={member.role} size="sm" />
                        <div
                          className={`flex items-center space-x-1 text-xs ${getStatusColor(member.status)}`}
                        >
                          {getStatusIcon(member.status)}
                          <span className="capitalize">{member.status}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-secondary">
                        <div className="flex items-center space-x-1">
                          <EnvelopeIcon className="h-4 w-4" />
                          <span>{member.email}</span>
                        </div>
                        <div>
                          Last active: {formatLastActive(member.lastActive)}
                        </div>
                        {member.invitedBy && (
                          <div>Invited by: {member.invitedBy}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <button
                        onClick={() =>
                          setShowMemberActions(
                            showMemberActions === member.id ? null : member.id,
                          )
                        }
                        className="p-2 text-secondary hover:text-primary transition-colors"
                      >
                        <EllipsisVerticalIcon className="h-5 w-5" />
                      </button>

                      {showMemberActions === member.id && (
                        <div className="absolute right-0 top-full mt-2 w-48 glass-strong border border-gray-600 rounded-xl p-2 z-10">
                          <button
                            onClick={() => {
                              console.log("Edit member:", member.id);
                              setShowMemberActions(null);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            Edit Role
                          </button>
                          <button
                            onClick={() => {
                              console.log("Deactivate member:", member.id);
                              setShowMemberActions(null);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-secondary hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            {member.status === "active"
                              ? "Deactivate"
                              : "Activate"}
                          </button>
                          {member.role !== "admin" && (
                            <button
                              onClick={() => {
                                handleRemoveMember(member.id);
                                setShowMemberActions(null);
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-neon-pink hover:bg-gray-700 rounded-lg transition-colors"
                            >
                              Remove Member
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Invites */}
        {pendingInvites.length > 0 && (
          <div className="glass-strong p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-primary">
                Pending Invitations
              </h2>
              <div className="text-sm text-secondary">
                {pendingInvites.length} pending
              </div>
            </div>

            <div className="space-y-4">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="glass p-4 rounded-xl border border-yellow-400/20"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Pending Icon */}
                      <div className="w-12 h-12 bg-yellow-500/20 border border-yellow-500/30 rounded-full flex items-center justify-center">
                        <ClockIcon className="h-6 w-6 text-yellow-400" />
                      </div>

                      {/* Invite Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <h3 className="font-semibold text-primary">
                            {invite.email}
                          </h3>
                          <RoleBadge role={invite.role} size="sm" />
                          <div className="flex items-center space-x-1 text-xs text-yellow-400">
                            <ClockIcon className="h-4 w-4" />
                            <span>Pending</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-secondary">
                          <div>Invited by: {invite.invitedBy}</div>
                          <div>
                            Sent: {invite.invitedAt.toLocaleDateString()}
                          </div>
                          <div>
                            Expires: {invite.expiresAt.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleResendInvite(invite.id)}
                        className="px-3 py-1 text-xs bg-neon-blue/20 text-neon-blue border border-neon-blue/30 rounded-lg hover:bg-neon-blue/30 transition-colors"
                      >
                        Resend
                      </button>
                      <button
                        onClick={() => handleCancelInvite(invite.id)}
                        className="px-3 py-1 text-xs bg-neon-pink/20 text-neon-pink border border-neon-pink/30 rounded-lg hover:bg-neon-pink/30 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feature Notice */}
        <div className="glass-strong p-6 rounded-2xl border border-neon-blue/30">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-neon-blue/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <ExclamationTriangleIcon className="h-6 w-6 text-neon-blue" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">
                Beta Feature
              </h3>
              <p className="text-secondary leading-relaxed mb-4">
                Team management is currently in beta. Some features like
                role-based permissions, advanced member analytics, and bulk
                actions are still being integrated. Full functionality will be
                available in the next release.
              </p>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1 text-neon-green">
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>Invite members</span>
                </div>
                <div className="flex items-center space-x-1 text-neon-green">
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>Role assignment</span>
                </div>
                <div className="flex items-center space-x-1 text-yellow-400">
                  <ClockIcon className="h-4 w-4" />
                  <span>Advanced permissions (coming soon)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInvite={handleInviteMember}
      />
    </div>
  );
}
