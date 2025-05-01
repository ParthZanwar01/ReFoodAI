import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, ScrollView } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { getUploads, uploadFile } from '../utils/api';

export default function UploadScreen() {
  const [uploads, setUploads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState('');

  const fetchUploads = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getUploads();
      setUploads(res.uploads);
    } catch (e) {
      setError('Failed to load uploads');
    } finally {
      setLoading(false);
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
      const result = await DocumentPicker.getDocumentAsync({ type: 'text/csv', copyToCacheDirectory: true });
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
        setSuccess('Upload complete! 🎉');
        fetchUploads();
      }
    } catch (e) {
      setError('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.heading}>Upload Data</Text>
      <View style={styles.uploadBox}>
        <Text style={styles.uploadText}>Upload a CSV file of your menu or sales data.</Text>
        <TouchableOpacity style={styles.uploadBtn} onPress={handlePickFile} disabled={uploading}>
          <Text style={styles.uploadBtnText}>{uploading ? 'Uploading...' : 'Select File'}</Text>
        </TouchableOpacity>
        {success ? <Text style={styles.success}>{success}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
      <Text style={styles.heading2}>Previous Uploads</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#3DC86F" />
      ) : (
        <FlatList
          data={uploads}
          keyExtractor={item => item.id?.toString() || item.filename}
          renderItem={({ item }) => (
            <View style={styles.uploadItem}>
              <Text style={styles.uploadFile}>{item.filename}</Text>
              <Text style={styles.uploadDate}>{item.uploaded_at}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.uploadText}>No uploads yet.</Text>}
          scrollEnabled={false}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#184C3A',
  },
  contentContainer: {
    padding: 32,
    paddingBottom: 60,
  },
  heading: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 32,
  },
  heading2: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
    marginTop: 32,
  },
  uploadBox: {
    backgroundColor: '#245C47',
    borderRadius: 18,
    padding: 32,
    alignItems: 'center',
    marginBottom: 32,
  },
  uploadText: {
    color: '#CBD5E1',
    fontSize: 18,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 28,
  },
  uploadBtn: {
    backgroundColor: '#3DC86F',
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 16,
    marginBottom: 16,
  },
  uploadBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  success: {
    color: '#3DC86F',
    fontSize: 16,
    marginTop: 16,
  },
  error: {
    color: '#E53E3E',
    fontSize: 16,
    marginTop: 16,
  },
  uploadItem: {
    backgroundColor: '#245C47',
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
  },
  uploadFile: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  uploadDate: {
    color: '#CBD5E1',
    fontSize: 14,
  },
}); 