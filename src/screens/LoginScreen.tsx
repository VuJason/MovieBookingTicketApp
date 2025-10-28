import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { ValidationUtils } from '../utils/validation';

const { width, height } = Dimensions.get('window');

interface LoginScreenProps {
  navigation: any;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuth();

  const handleLogin = async () => {
    // Validate form
    const validation = ValidationUtils.validateLoginForm(email, password);
    if (!validation.isValid) {
      Alert.alert('Lỗi nhập liệu', validation.message || 'Vui lòng kiểm tra thông tin nhập vào');
      return;
    }

    try {
      // Call login API
      const success = await login({
        email: email.trim(),
        password: password,
      });

      if (success) {
        // Show success message
        Alert.alert(
          'Đăng nhập thành công',
          'Chào mừng bạn đến với CinemaBook!',
          [
            {
              text: 'Tiếp tục',
              onPress: () => navigation.replace('Main')
            }
          ]
        );
      }
    } catch (error) {
      // Handle different types of errors
      if (error instanceof Error) {
        if (error.message === 'INVALID_CREDENTIALS') {
          Alert.alert(
            'Đăng nhập thất bại',
            'Tài khoản hoặc mật khẩu không tồn tại. Vui lòng kiểm tra lại thông tin đăng nhập.',
            [
              { text: 'Thử lại', style: 'default' },
              {
                text: 'Đăng ký tài khoản',
                style: 'default',
                onPress: () => navigation.navigate('Register')
              }
            ]
          );
        } else if (error.message === 'NETWORK_ERROR') {
          Alert.alert(
            'Lỗi kết nối',
            'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Lỗi',
            'Đã xảy ra lỗi không xác định. Vui lòng thử lại.',
            [{ text: 'OK' }]
          );
        }
      }
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Quên mật khẩu',
      'Tính năng này sẽ được cập nhật sớm!',
      [{ text: 'OK' }]
    );
  };

  const handleSignUp = () => {
    navigation.navigate('Register');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Background Gradient */}
          <LinearGradient
            colors={['#000', '#1a0a00', '#000']}
            style={styles.backgroundGradient}
          >
            {/* Header Section */}
            <View style={styles.headerSection}>
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={['#FF6B35', '#FF4500']}
                  style={styles.logoGradient}
                >
                  <Icon name="film" size={40} color="#fff" />
                </LinearGradient>
                <Text style={styles.logoText}>CinemaBook</Text>
                <Text style={styles.logoSubtext}>Your Movie Experience</Text>
              </View>
            </View>

            {/* Form Section */}
            <View style={styles.formSection}>
              <View style={styles.formContainer}>
                {/* Email Input */}
                <View style={[styles.inputGroup, styles.firstInputGroup]}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View style={styles.inputContainer}>
                    <Icon name="mail-outline" size={20} color="#FF4500" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email"
                      placeholderTextColor="#666"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={styles.inputContainer}>
                    <Icon name="lock-closed-outline" size={20} color="#FF4500" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your password"
                      placeholderTextColor="#666"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      editable={!isLoading}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeButton}
                      disabled={isLoading}
                    >
                      <Icon
                        name={showPassword ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Forgot Password */}
                <TouchableOpacity
                  style={styles.forgotPasswordContainer}
                  onPress={handleForgotPassword}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>

                {/* Login Button */}
                <TouchableOpacity
                  style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                  onPress={handleLogin}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={isLoading ? ['#666', '#555'] : ['#FF6B35', '#FF4500']}
                    style={styles.loginButtonGradient}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <>
                        <Icon name="log-in-outline" size={20} color="#fff" />
                        <Text style={styles.loginButtonText}>Sign In</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Register Section */}
                <View style={styles.registerSection}>
                  <View style={styles.registerPromptContainer}>
                    <Text style={styles.registerPromptText}>Don't have an account? </Text>
                    <TouchableOpacity onPress={handleSignUp} activeOpacity={0.7}>
                      <Text style={styles.registerLinkText}>Sign up here</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.registerButton}
                    onPress={handleSignUp}
                    activeOpacity={0.7}
                  >
                    <View style={styles.registerButtonContent}>
                      <Icon name="person-add" size={18} color="#FF4500" />
                      <Text style={styles.registerButtonText}>Create New Account</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Divider */}
                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Social Login Buttons */}
                <View style={styles.socialButtonsContainer}>
                  <TouchableOpacity style={styles.socialButton}>
                    <Icon name="logo-google" size={20} color="#DB4437" />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.socialButton}>
                    <Icon name="logo-facebook" size={20} color="#4267B2" />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.socialButton}>
                    <Icon name="logo-apple" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>

                {/* Already have account link */}
                <View style={styles.alreadyHaveAccountContainer}>
                  <Text style={styles.alreadyHaveAccountText}>Already have an account? </Text>
                  <TouchableOpacity onPress={() => { }}>
                    <Text style={styles.alreadyHaveAccountLink}>Just sign in above</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </LinearGradient>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  keyboardView: {
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
  },
  headerSection: {
    flex: 0.4,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#FF4500',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  logoSubtext: {
    fontSize: 16,
    color: '#888',
    fontWeight: '300',
  },
  formSection: {
    flex: 0.6,
    justifyContent: 'flex-start',
  },
  formContainer: {
    paddingHorizontal: 32,
    paddingTop: 10,
  },
  inputGroup: {
    marginBottom: 20,
  },
  firstInputGroup: {
    marginTop: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,69,0,0.3)',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
  },
  eyeButton: {
    padding: 4,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#FF4500',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#FF4500',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dividerText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
    paddingHorizontal: 16,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  registerSection: {
    marginBottom: 20,
  },
  registerPromptContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  registerPromptText: {
    color: '#888',
    fontSize: 15,
  },
  registerLinkText: {
    color: '#FF4500',
    fontSize: 15,
    fontWeight: '600',
  },
  registerButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FF4500',
    backgroundColor: 'transparent',
  },
  registerButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  registerButtonText: {
    color: '#FF4500',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
  alreadyHaveAccountContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  alreadyHaveAccountText: {
    color: '#888',
    fontSize: 14,
  },
  alreadyHaveAccountLink: {
    color: '#FF4500',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoginScreen;