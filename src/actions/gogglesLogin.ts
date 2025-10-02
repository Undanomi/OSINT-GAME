'use server';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface PasswordResetData {
  email: string;
  birthday: string;
}

export interface SecretQuestionAnswer {
  questionId: number;
  answer: string;
}

export interface LoginResult {
  success: boolean;
  error?: string;
  redirectUrl?: string;
}

export interface PasswordResetResult {
  success: boolean;
  error?: string;
  nextStep?: string;
}

export interface QuestionResult {
  success: boolean;
  error?: string;
  nextQuestion?: number;
  completed?: boolean;
}

/**
 * ログイン認証
 */
export async function authenticateLogin(credentials: LoginCredentials): Promise<LoginResult> {
  // 入力データの基本的なバリデーション
  if (!credentials.email || !credentials.password) {
    return {
      success: false,
      error: 'メールアドレスとパスワードを入力してください。'
    };
  }

  // メールアドレスの形式チェック
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(credentials.email)) {
    return {
      success: false,
      error: 'メールアドレスの形式が正しくありません。'
    };
  }

  // NOTE: ゲーム用に常に失敗するように設定
  return {
    success: false,
    error: 'メールアドレスまたはパスワードが間違っています。'
  };
}

/**
 * パスワードリセット用のメール・生年月日認証
 */
export async function validatePasswordResetData(data: PasswordResetData): Promise<PasswordResetResult> {
  // 入力データの基本的なバリデーション
  if (!data.email || !data.birthday) {
    return {
      success: false,
      error: 'メールアドレスと生年月日を入力してください。'
    };
  }

  // メールアドレスの形式チェック
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return {
      success: false,
      error: 'メールアドレスの形式が正しくありません。'
    };
  }

  // 生年月日の形式チェック（YYYY-MM-DD）
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(data.birthday)) {
    return {
      success: false,
      error: '生年月日の形式が正しくありません。'
    };
  }

  // 入力値チェック
  const correctEmail = 'y.nitta.1998@goggles.com';
  const correctBirthday = '1998-04-10';

  if (data.email === correctEmail && data.birthday === correctBirthday) {
    return {
      success: true,
      nextStep: 'method-selection'
    };
  }

  return {
    success: false,
    error: 'メールアドレスまたは生年月日が間違っています'
  };
}

/**
 * SMS 認証
 */
export async function validateSMSCode(phoneNumber: string): Promise<PasswordResetResult> {
  // 入力データの基本的なバリデーション
  if (!phoneNumber) {
    return {
      success: false,
      error: '電話番号を入力してください。'
    };
  }

  // NOTE: ゲーム用に常に失敗するように設定
  return {
    success: false,
    error: '電話番号が間違っています'
  };
}

/**
 * 秘密の質問の回答を検証
 */
export async function validateSecretQuestion(questionData: SecretQuestionAnswer): Promise<QuestionResult> {
  // 入力データの基本的なバリデーション
  if (!questionData.answer || questionData.answer.trim() === '') {
    return {
      success: false,
      error: '回答を入力してください。'
    };
  }

  // 秘密の質問の答え
  const correctAnswers: Record<number, string[]> = {
    1: ['ワンダーフォーゲル部'],
    2: ['こむぎ'],
    3: ['テリーズカフェ調布駅前店']
  };

  const correctAnswerList = correctAnswers[questionData.questionId];
  if (!correctAnswerList) {
    return {
      success: false,
      error: '無効な質問です。'
    };
  }

  // 回答の照合（大文字小文字・スペースは区別しない）
  const normalize = (str: string) => str.replace(/\s+/g, '').toLowerCase();
  const userAnswer = normalize(questionData.answer);
  if (correctAnswerList.some(ans => userAnswer === normalize(ans))) {
    if (questionData.questionId < 3) {
      return {
        success: true,
        nextQuestion: questionData.questionId + 1
      };
    } else {
      return {
        success: true,
        completed: true
      };
    }
  }

  return {
    success: false,
    error: '答えが正しくありません。もう一度入力してください。'
  };
}

/**
 * パスワードリセット
 */
export async function resetPassword(newPassword: string, confirmPassword: string): Promise<PasswordResetResult> {
  // 入力データの基本的なバリデーション
  if (!newPassword || !confirmPassword) {
    return {
      success: false,
      error: 'パスワードを入力してください。'
    };
  }

  // パスワードの一致チェック
  if (newPassword !== confirmPassword) {
    return {
      success: false,
      error: 'パスワードが一致しません。'
    };
  }

  // パスワードの長さチェック
  if (newPassword.length < 6) {
    return {
      success: false,
      error: 'パスワードは6文字以上で入力してください。'
    };
  }

  // パスワードの複雑性チェック（半角英数字を含む）
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);

  if (!hasLetter || !hasNumber) {
    return {
      success: false,
      error: 'パスワードは半角英数字を組み合わせて入力してください。'
    };
  }

  return {
    success: true,
    nextStep: 'login-success'
  };
}