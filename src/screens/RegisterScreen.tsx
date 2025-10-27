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
  ScrollView,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { ValidationUtils } from '../utils/validation';
import { apiService } from '../api/apicall';

interface RegisterScreenProps {
  navigation: any;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    sex: 'male', // Default value
    dateOfBirth: '', // User will input DD/MM/YYYY
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    // Validate form
    const nameValidation = ValidationUtils.validateName(formData.name);
    if (!nameValidation.isValid) {
      Alert.alert('Lỗi', nameValidation.message);
      return;
    }

    const emailValidation = ValidationUtils.validateEmail(formData.email);
    if (!emailValidation.isValid) {
      Alert.alert('Lỗi', emailValidation.message);
      return;
    }

    const phoneValidation = ValidationUtils.validatePhone(formData.phone);
    if (!phoneValidation.isValid) {
      Alert.alert('Lỗi', phoneValidation.message);
      return;
    }

    const passwordValidation = ValidationUtils.validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      Alert.alert('Lỗi', passwordValidation.message);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }

    // Validate date of birth
    if (!formData.dateOfBirth) {
      Alert.alert('Lỗi', 'Vui lòng nhập ngày sinh');
      return;
    }

    // Convert date from DD/MM/YYYY to YYYY-MM-DD
    const dateParts = formData.dateOfBirth.split('/');
    if (dateParts.length !== 3) {
      Alert.alert('Lỗi', 'Định dạng ngày sinh không đúng. Vui lòng nhập theo format DD/MM/YYYY');
      return;
    }
    const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;

    setIsLoading(true);

    try {
      console.log('Registering user...');
      
      // Call register API
      const response = await apiService.register({
        fullName: formData.name,
        password: formData.password,
        email: formData.email,
        phone: formData.phone,
        sex: formData.sex,
        dateOfBirth: formattedDate,
      });

      console.log('Register response:', response);

      if (response && (response.code === 200 || response.code === 201)) {
        Alert.alert(
          'Đăng ký thành công',
          'Tài khoản của bạn đã được tạo thành công!',
          [
            {
              text: 'Đăng nhập ngay',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      } else {
        throw new Error(response?.message || 'Đăng ký thất bại');
      }
    } catch (error: any) {
      console.error('Register error:', error);
      
      let errorMessage = 'Đăng ký thất bại. Vui lòng thử lại.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <LinearGradient
            colors={['#000', '#1a0a00', '#000']}
            style={styles.backgroundGradient}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.navigate('Login')}
              >
                <Icon name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.formContainer}>
                <Text style={styles.welcomeText}>Join CinemaBook</Text>
                <Text style={styles.subtitleText}>Create your account to get started</Text>

                {/* Name Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <View style={styles.inputContainer}>
                    <Icon name="person-outline" size={20} color="#FF4500" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your full name"
                      placeholderTextColor="#666"
                      value={formData.name}
                      onChangeText={(value) => handleInputChange('name', value)}
                      editable={!isLoading}
                    />
                  </View>
                </View>

                {/* Email Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View style={styles.inputContainer}>
                    <Icon name="mail-outline" size={20} color="#FF4500" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email"
                      placeholderTextColor="#666"
                      value={formData.email}
                      onChangeText={(value) => handleInputChange('email', value)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
                    />
                  </View>
                </View>

                {/* Phone Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <View style={styles.inputContainer}>
                    <Icon name="call-outline" size={20} color="#FF4500" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your phone number"
                      placeholderTextColor="#666"
                      value={formData.phone}
                      onChangeText={(value) => handleInputChange('phone', value)}
                      keyboardType="phone-pad"
                      editable={!isLoading}
                    />
                  </View>
                </View>

                {/* Gender Selection */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Gender</Text>
                  <View style={styles.genderContainer}>
                    <TouchableOpacity
                      style={[
                        styles.genderButton,
                        formData.sex === 'male' && styles.genderButtonActive
                      ]}
                      onPress={() => handleInputChange('sex', 'male')}
                      disabled={isLoading}
                    >
                      <Icon 
                        name="male" 
                        size={20} 
                        color={formData.sex === 'male' ? '#fff' : '#666'} 
                      />
                      <Text style={[
                        styles.genderText,
                        formData.sex === 'male' && styles.genderTextActive
                      ]}>Male</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.genderButton,
                        formData.sex === 'female' && styles.genderButtonActive
                      ]}
                      onPress={() => handleInputChange('sex', 'female')}
                      disabled={isLoading}
                    >
                      <Icon 
                        name="female" 
                        size={20} 
                        color={formData.sex === 'female' ? '#fff' : '#666'} 
                      />
                      <Text style={[
                        styles.genderText,
                        formData.sex === 'female' && styles.genderTextActive
                      ]}>Female</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Date of Birth Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Date of Birth</Text>
                  <View style={styles.inputContainer}>
                    <Icon name="calendar-outline" size={20} color="#FF4500" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="DD/MM/YYYY"
                      placeholderTextColor="#666"
                      value={formData.dateOfBirth}
                      onChangeText={(value) => handleInputChange('dateOfBirth', value)}
                      editable={!isLoading}
                    />
                  </View>
                  <Text style={styles.helperText}>Format: DD/MM/YYYY (e.g., 01/01/2000)</Text>
                </View>

                {/* Password Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={styles.inputContainer}>
                    <Icon name="lock-closed-outline" size={20} color="#FF4500" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Create a password"
                      placeholderTextColor="#666"
                      value={formData.password}
                      onChangeText={(value) => handleInputChange('password', value)}
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

                {/* Confirm Password Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <View style={styles.inputContainer}>
                    <Icon name="lock-closed-outline" size={20} color="#FF4500" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm your password"
                      placeholderTextColor="#666"
                      value={formData.confirmPassword}
                      onChangeText={(value) => handleInputChange('confirmPassword', value)}
                      secureTextEntry={!showConfirmPassword}
                      editable={!isLoading}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={styles.eyeButton}
                      disabled={isLoading}
                    >
                      <Icon
                        name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Register Button */}
                <TouchableOpacity
                  style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
                  onPress={handleRegister}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={isLoading ? ['#666', '#555'] : ['#FF6B35', '#FF4500']}
                    style={styles.registerButtonGradient}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <>
                        <Icon name="person-add-outline" size={20} color="#fff" />
                        <Text style={styles.registerButtonText}>Create Account</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Login Link */}
                <View style={styles.loginContainer}>
                  <Text style={styles.loginText}>Already have an account? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.loginLink}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 60,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,69,0,0.4)',
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitleText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,69,0,0.3)',
    paddingHorizontal: 14,
    height: 50,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '400',
  },
  eyeButton: {
    padding: 4,
  },
  registerButton: {
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 20,
    shadowColor: '#FF4500',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  registerButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  registerButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginText: {
    color: '#888',
    fontSize: 14,
  },
  loginLink: {
    color: '#FF4500',
    fontSize: 14,
    fontWeight: '600',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,69,0,0.3)',
    paddingVertical: 14,
    gap: 8,
  },
  genderButtonActive: {
    backgroundColor: '#FF4500',
    borderColor: '#FF4500',
  },
  genderText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '600',
  },
  genderTextActive: {
    color: '#fff',
  },
  helperText: {
    color: '#666',
    fontSize: 11,
    marginTop: 4,
    marginLeft: 2,
  },
});

export default RegisterScreen;