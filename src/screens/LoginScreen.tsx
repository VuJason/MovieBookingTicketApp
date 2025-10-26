import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import Icon from 'react-native-vector-icons/Ionicons';
import { runApiTests } from '../utils/apiTest';

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState(''); // Pre-fill with test credentials
  const [password, setPassword] = useState(''); // Pre-fill with test credentials
  const [showPassword, setShowPassword] = useState(false);
  const [isTestingApi, setIsTestingApi] = useState(false);
  const { login, isLoading } = useAuth();

  const handleLogin = async () => {
    // Validate input
    if (!email.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập email');
      return;
    }
    
    if (!password.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu');
      return;
    }

    // Call login API
    const success = await login({
      email: email.trim(),
      password: password,
    });

    if (success) {
      // Navigate back to previous screen or home
      navigation.goBack();
    }
  };

  const handleTestApi = async () => {
    setIsTestingApi(true);
    try {
      await runApiTests();
      Alert.alert(
        'API Test Complete',
        'Check console logs for detailed results',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('API Test Error:', error);
      Alert.alert(
        'API Test Failed',
        'Check console logs for error details',
        [{ text: 'OK' }]
      );
    } finally {
      setIsTestingApi(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>Movie Ticket</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Đăng nhập</Text>
          
          <View style={styles.inputContainer}>
            <Icon name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Mật khẩu"
              placeholderTextColor="#888"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!isLoading}
            />
            <TouchableOpacity 
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
              disabled={isLoading}
            >
              <Icon 
                name={showPassword ? "eye-outline" : "eye-off-outline"} 
                size={20} 
                color="#888" 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.loginButton,
              isLoading && styles.loginButtonDisabled
            ]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>ĐĂNG NHẬP</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>HOẶC</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.signupButton}>
            <Text style={styles.signupButtonText}>Tạo tài khoản mới</Text>
          </TouchableOpacity>

          {/* API Test Button - Only in development */}
          {__DEV__ && (
            <TouchableOpacity 
              style={[styles.testApiButton, isTestingApi && styles.testApiButtonDisabled]}
              onPress={handleTestApi}
              disabled={isTestingApi}
            >
              {isTestingApi ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.testApiButtonText}>TEST API CONNECTION</Text>
              )}
            </TouchableOpacity>
          )}

        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF4500',
  },
  formContainer: {
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 5,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 25,
  },
  forgotPasswordText: {
    color: '#FF4500',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#FF4500',
    borderRadius: 8,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginButtonDisabled: {
    backgroundColor: '#666',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    color: '#888',
    paddingHorizontal: 10,
    fontSize: 14,
  },
  signupButton: {
    borderWidth: 1,
    borderColor: '#FF4500',
    borderRadius: 8,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signupButtonText: {
    color: '#FF4500',
    fontSize: 16,
    fontWeight: '500',
  },
  testApiButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  testApiButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  testApiButtonDisabled: {
    backgroundColor: '#666',
  },
});

export default LoginScreen;
