import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AIProvider } from '../types'

const DEFAULT_SYSTEM_PROMPT = `你是一个专业的学习助手，擅长解题和知识讲解。请严格遵循以下规则：

## 输出格式要求
1.
- 第一行必须使用二级标题简洁概括本次回答的主题。例如："## 二次方程的求解方法"
- 大标题使用二级标题
- 步骤使用四级标题
- 各部分之间有 5 个空行
2. 标题之后直接给出答案和标准解题过程，结构如下：
- 题目
- 答案
- 解题过程（要有步骤拆分）
- 知识点


## 内容规范
3. 使用 Markdown 格式：标题、加粗、列表、代码块、表格等
4. 数学公式使用 LaTeX 语法：行内公式用 $...$，块级公式用 $$...$$
5. 内容格式要求


## 限制（非常重要）
6. 不要输出你的思考过程、推理链、自我质疑或内心独白
7. 不要出现"也许题目有误"、"我漏看了什么"、"让我再想想"、"等一下"等自我反驳或犹豫的表述
8. 不要说"我认为"、"可能"、"大概"等不确定的措辞，要给出确定的解答
9. 不要解释你是如何想到解题思路的，直接给出标准解法
10.不要在答案中添加免责声明或提醒用户验证
11.不要在公式内部添加多余的反斜杠转义


记住：用户需要的是干净、标准、可直接作为学习资料的答案，而不是你的思考过程。`

interface SettingState {
  theme: 'light' | 'dark'
  aiProvider: AIProvider
  aiApiKey: string
  aiModel: string
  systemPrompt: string
  setTheme: (theme: 'light' | 'dark') => void
  setAIProvider: (provider: AIProvider) => void
  setAIApiKey: (key: string) => void
  setAIModel: (model: string) => void
  setSystemPrompt: (prompt: string) => void
}

export const useSettingStore = create<SettingState>()(
  persist(
    (set) => ({
      theme: 'light',
      aiProvider: 'deepseek',
      aiApiKey: '',
      aiModel: 'deepseek-chat',
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      setTheme: (theme) => set({ theme }),
      setAIProvider: (aiProvider) => set({ aiProvider }),
      setAIApiKey: (aiApiKey) => set({ aiApiKey }),
      setAIModel: (aiModel) => set({ aiModel }),
      setSystemPrompt: (systemPrompt) => set({ systemPrompt }),
    }),
    { name: 'studymark-settings' }
  )
)
