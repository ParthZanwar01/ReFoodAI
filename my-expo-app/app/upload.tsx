import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, ScrollView, Platform, Alert, RefreshControl } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { getUploads, uploadFile } from '../utils/api';
import { AuthContext } from '../context/AuthContext';

export default function UploadScreen() {
  const { user } = useContext(AuthContext);
  const [uploads, setUploads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchUploads = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const res = await getUploads();
      setUploads(res.uploads || []);
    } catch (e: any) {
      console.error('Upload fetch error:', e);
      setError('Failed to load uploads');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUploads();
  }, []);

  const handlePickFile = async () => {
    setError('');
    setSuccess('');
    setUploading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({ 
        type: ['text/csv', 'text/comma-separated-values', 'application/csv'],
        copyToCacheDirectory: true 
      });
      
      if (result.type === 'success') {
        const fileUri = result.uri;
        const fileName = result.name;
        let file: any;
        
        if (Platform.OS === 'web') {
          // Web: fetch the file as a blob
          const response = await fetch(fileUri);
          const blob = await response.blob();
          file = new File([blob], fileName, { type: 'text/csv' });
        } else {
          // Native: use the uri directly
          file = { uri: fileUri, name: fileName, type: 'text/csv' };
        }
        
        await uploadFile(file);
        setSuccess(`✅ Upload complete! File "${fileName}" processed successfully.`);
        Alert.alert(
          '🎉 Upload Successful!',
          `Your file "${fileName}" has been uploaded and processed. The data is now available for AI analysis.`,
          [{ text: 'Great!', style: 'default' }]
        );
        fetchUploads();
      }
    } catch (e: any) {
      console.error('Upload error:', e);
      setError('❌ Upload failed. Please try again.');
      Alert.alert(
        '❌ Upload Failed',
        'There was an error uploading your file. Please check your connection and try again.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setUploading(false);
    }
  };

  const onRefresh = () => {
    fetchUploads(true);
  };

  if (loading && uploads.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3DC86F" />
        <Text style={styles.loadingText}>Loading upload history...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          colors={['#3DC86F']}
          tintColor="#3DC86F"
        />
      }
    >
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>📤 Data Upload Center</Text>
          <Text style={styles.subtitle}>
            Welcome back, {user?.email?.split('@')[0]}! Upload your data files to power AI predictions.
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh} disabled={refreshing}>
          <Text style={styles.refreshText}>{refreshing ? '🔄' : '⚡'} Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Upload Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📁 Upload New Data</Text>
        <View style={styles.uploadCard}>
          <View style={styles.uploadIconContainer}>
            <Text style={styles.uploadIcon}>📊</Text>
          </View>
          <Text style={styles.uploadTitle}>Upload CSV Files</Text>
          <Text style={styles.uploadDescription}>
            Upload menu data, sales records, or inventory files to enhance AI predictions and optimization.
          </Text>
          
          <View style={styles.supportedFormats}>
            <Text style={styles.formatsTitle}>Supported formats:</Text>
            <View style={styles.formatsList}>
              <Text style={styles.formatItem}>📄 .csv (Comma Separated Values)</Text>
              <Text style={styles.formatItem}>📊 Menu planning data</Text>
              <Text style={styles.formatItem}>💰 Sales and inventory records</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]} 
            onPress={handlePickFile} 
            disabled={uploading}
          >
            <Text style={styles.uploadButtonText}>
              {uploading ? '⏳ Uploading...' : '📤 Select File to Upload'}
            </Text>
          </TouchableOpacity>

          {success && (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>{success}</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={handlePickFile}>
                <Text style={styles.retryText}>🔄 Retry Upload</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Upload History Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Upload History</Text>
        {uploads.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No uploads yet</Text>
            <Text style={styles.emptyDescription}>
              Upload your first CSV file to start powering AI predictions and optimization.
            </Text>
          </View>
        ) : (
          <View style={styles.uploadsList}>
            {uploads.map((item, index) => (
              <View key={item.id?.toString() || `${item.filename}-${index}`} style={styles.uploadItem}>
                <View style={styles.uploadItemLeft}>
                  <Text style={styles.uploadFileIcon}>📄</Text>
                  <View style={styles.uploadItemDetails}>
                    <Text style={styles.uploadFileName}>{item.filename || 'Unknown file'}</Text>
                    <Text style={styles.uploadFileDate}>
                      {item.uploaded_at ? new Date(item.uploaded_at).toLocaleDateString() : 'Unknown date'}
                    </Text>
                  </View>
                </View>
                <View style={styles.uploadItemRight}>
                  <Text style={styles.uploadStatus}>✅ Processed</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E293B',
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#CBD5E1',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 16,
    lineHeight: 24,
  },
  refreshButton: {
    backgroundColor: '#3DC86F',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 16,
  },
  refreshText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  uploadCard: {
    backgroundColor: '#334155',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  uploadIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#3DC86F',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadIcon: {
    fontSize: 40,
  },
  uploadTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  uploadDescription: {
    color: '#94A3B8',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  supportedFormats: {
    backgroundColor: '#475569',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  formatsTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  formatsList: {
    gap: 8,
  },
  formatItem: {
    color: '#CBD5E1',
    fontSize: 14,
    lineHeight: 20,
  },
  uploadButton: {
    backgroundColor: '#3DC86F',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
    marginBottom: 16,
    minWidth: 200,
  },
  uploadButtonDisabled: {
    backgroundColor: '#6B7280',
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  successContainer: {
    backgroundColor: '#065F46',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    width: '100%',
  },
  successText: {
    color: '#10B981',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#7F1D1D',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#EF4444',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: '#334155',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    color: '#94A3B8',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  uploadsList: {
    gap: 12,
  },
  uploadItem: {
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  uploadItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  uploadFileIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  uploadItemDetails: {
    flex: 1,
  },
  uploadFileName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  uploadFileDate: {
    color: '#94A3B8',
    fontSize: 14,
  },
  uploadItemRight: {
    marginLeft: 16,
  },
  uploadStatus: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
  },
}); 