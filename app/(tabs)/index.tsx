import { useRouter } from 'expo-router';
import { useContext } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StudentCard from '../../components/StudentCard';
import PrimaryButton from '../../components/ui/primary-button';
import ScreenHeader from '../../components/ui/screen-header';
import { Student, StudentContext } from '../_layout';

export default function IndexScreen() {
  const router = useRouter();
  const context = useContext(StudentContext);

  if (!context) return null;

  const { students } = context;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        title="Students"
        subtitle={`${students.length} enrolled`}
      />

      <PrimaryButton
        label="Add Student"
        onPress={() => router.push({ pathname: '../add' })}
      />

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {students.map((student: Student) => (
          <StudentCard key={student.id} student={student} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#F8FAFC',
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  listContent: {
    paddingBottom: 24,
    paddingTop: 14,
  },
});