/**
 * Lab dashboard strings, loaded only when the lab section opens.
 * `bn` must match `en`'s shape (typed + tested).
 */
export const en = {
  pending: {
    body: 'An administrator is checking your DGHS licence. You will be able to upload reports as soon as it is approved.',
    license: 'DGHS licence',
    step1: 'An admin matches your licence number with the DGHS registry.',
  },
  home: {
    title: 'Welcome, {{name}}',
    subtitle: 'Find a patient to upload the reports their doctor ordered.',
    recentTitle: 'Recent uploads',
    total: 'Total uploaded: {{count}}',
    viewAll: 'View all',
    howTitle: 'How uploading works',
    step1: 'Find the patient by UHID or mobile number.',
    step2: 'Pick a test their doctor ordered.',
    step3: 'Attach the PDF. The patient is notified at once.',
  },
  upload: {
    title: 'Upload a report',
    subtitle: 'Find the patient, pick a test their doctor ordered, and attach the PDF.',
    phone: 'Phone',
    testsTitle: 'Tests ordered by the doctor',
    waiting: 'Waiting for a report: {{count}}',
    allDone: 'Every ordered test has a report.',
    statusPending: 'Waiting for report',
    statusUploaded: 'Uploaded',
    justNow: 'Uploaded just now',
    orderedOn: 'Ordered {{date}}',
    uploadAction: 'Upload report',
    uploadAgain: 'Upload again',
    actionFor: '{{action}}: {{test}}',
    noTests: 'No tests ordered yet',
    noTestsBody:
      'A lab can only upload reports for tests a doctor has prescribed. Ask the patient whether their doctor has added the prescription in HealthNexus.',
    dialogTitle: 'Upload {{test}} report',
    dialogFor: 'For {{name}} · {{uhid}}',
    secureNote: 'The PDF is encrypted before it is stored. {{name}} is notified by SMS and in the app.',
    cancel: 'Cancel',
    submit: 'Upload report',
    uploading: 'Encrypting and uploading…',
    done: '{{test}} report uploaded. {{name}} has been notified.',
  },
  history: {
    title: 'Upload history',
    subtitle: 'Every report your lab has uploaded. Each time a report is opened, it is recorded in the patient’s access log.',
    empty: 'No reports uploaded yet',
    emptyBody: 'Reports you upload will appear here, newest first.',
    patient: '{{name}} · {{uhid}}',
  },
}

export type LabMessages = typeof en

export const bn: LabMessages = {
  pending: {
    body: 'একজন অ্যাডমিন আপনার DGHS লাইসেন্স যাচাই করছেন। অনুমোদন পাওয়ার সাথে সাথে আপনি রিপোর্ট আপলোড করতে পারবেন।',
    license: 'DGHS লাইসেন্স',
    step1: 'অ্যাডমিন আপনার লাইসেন্স নম্বর DGHS-এর তালিকার সাথে মিলিয়ে দেখবেন।',
  },
  home: {
    title: 'স্বাগতম, {{name}}',
    subtitle: 'ডাক্তারের দেওয়া পরীক্ষার রিপোর্ট আপলোড করতে রোগী খুঁজুন।',
    recentTitle: 'সাম্প্রতিক আপলোড',
    total: 'মোট আপলোড: {{count}}',
    viewAll: 'সব দেখুন',
    howTitle: 'আপলোড যেভাবে কাজ করে',
    step1: 'UHID বা মোবাইল নম্বর দিয়ে রোগী খুঁজুন।',
    step2: 'ডাক্তারের দেওয়া একটি পরীক্ষা বেছে নিন।',
    step3: 'PDF যুক্ত করুন। রোগী সাথে সাথে জানতে পারবেন।',
  },
  upload: {
    title: 'রিপোর্ট আপলোড',
    subtitle: 'রোগী খুঁজুন, ডাক্তারের দেওয়া পরীক্ষা বেছে নিন, তারপর PDF যুক্ত করুন।',
    phone: 'ফোন',
    testsTitle: 'ডাক্তারের দেওয়া পরীক্ষা',
    waiting: 'রিপোর্টের অপেক্ষায়: {{count}}',
    allDone: 'সব পরীক্ষার রিপোর্ট দেওয়া হয়েছে।',
    statusPending: 'রিপোর্টের অপেক্ষায়',
    statusUploaded: 'আপলোড হয়েছে',
    justNow: 'এইমাত্র আপলোড হয়েছে',
    orderedOn: 'দেওয়া হয়েছে {{date}}',
    uploadAction: 'রিপোর্ট আপলোড',
    uploadAgain: 'আবার আপলোড',
    actionFor: '{{action}}: {{test}}',
    noTests: 'এখনো কোনো পরীক্ষা দেওয়া হয়নি',
    noTestsBody:
      'ডাক্তার যে পরীক্ষা প্রেসক্রাইব করেছেন, ল্যাব শুধু সেগুলোর রিপোর্টই আপলোড করতে পারে। রোগীকে জিজ্ঞেস করুন তাঁর ডাক্তার HealthNexus-এ প্রেসক্রিপশন দিয়েছেন কিনা।',
    dialogTitle: '{{test}} রিপোর্ট আপলোড',
    dialogFor: '{{name}} · {{uhid}}-এর জন্য',
    secureNote: 'সংরক্ষণের আগে PDF-টি এনক্রিপ্ট করা হয়। {{name}} SMS ও অ্যাপে নোটিফিকেশন পাবেন।',
    cancel: 'বাতিল',
    submit: 'রিপোর্ট আপলোড',
    uploading: 'এনক্রিপ্ট ও আপলোড হচ্ছে…',
    done: '{{test}} রিপোর্ট আপলোড হয়েছে। {{name}}-কে জানানো হয়েছে।',
  },
  history: {
    title: 'আপলোডের ইতিহাস',
    subtitle: 'আপনার ল্যাবের আপলোড করা সব রিপোর্ট। যতবার কোনো রিপোর্ট খোলা হয়, রোগীর অ্যাক্সেস লগে তা লেখা থাকে।',
    empty: 'এখনো কোনো রিপোর্ট আপলোড হয়নি',
    emptyBody: 'আপনার আপলোড করা রিপোর্ট এখানে দেখাবে, নতুনগুলো আগে।',
    patient: '{{name}} · {{uhid}}',
  },
}
