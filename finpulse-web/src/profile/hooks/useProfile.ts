import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService, type UserProfileData } from '../services/profileService';
import toast from 'react-hot-toast';

export function useProfile() {
  return useQuery<UserProfileData>({
    queryKey: ['profile'],
    queryFn: profileService.getProfile,
    staleTime: 5 * 60 * 1000,
    retry: 1
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: profileService.updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(['profile'], data.user);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success(data.message || 'Profile updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update profile');
    }
  });
}

export function useAvatarUpload() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: profileService.uploadAvatar,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success(data.message || 'Avatar updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload avatar');
    }
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: profileService.changePassword,
    onSuccess: (data) => {
      toast.success(data.message || 'Password changed successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to change password');
    }
  });
}

export function useSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: profileService.getSessions
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: profileService.revokeSession,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success(data.message || 'Session revoked successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to revoke session');
    }
  });
}

export function useRevokeAllOtherSessions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: profileService.revokeAllOtherSessions,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success(data.message || 'All other active sessions revoked');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to revoke other sessions');
    }
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: profileService.deleteAccount,
    onSuccess: (data) => {
      toast.success(data.message || 'Account successfully deactivated');
      localStorage.clear();
      window.location.href = '/';
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete account');
    }
  });
}
