-- starter policies (DRAFTS: edit them in Admin > Policies and have a Nigerian lawyer review them)
insert into policies(kind,version,title,body) values
('terms',1,'Terms of Service',$b$## 1. About Shopa Orders
Shopa Orders ("Shopa", "we", "us") helps small businesses ("vendors") take and track orders from their customers. We do not sell goods ourselves. Each vendor is responsible for their own products, prices, delivery and customer service.

## 2. Your account
Give us true information and keep your password safe. You are responsible for everything done through your account. We may ask you to verify your business, and some features, such as showing bank details to customers, stay off until you are verified.

## 3. What vendors must do
Sell only products you are allowed to sell and can deliver. Describe them honestly. Deliver what customers pay for, and handle complaints and refunds fairly. Follow the Community Guidelines.

## 4. What is not allowed
Fraud, scams, fake listings, stolen or counterfeit goods, illegal items, harassment, or using Shopa to deceive people.

## 5. Fraud and illegal activity
If we believe an account is used for fraud or illegal activity, we may suspend or ban it without notice, keep records, and share information with law enforcement authorities where the law allows or requires it, or where we think it is appropriate to protect others.

## 6. Plans and payments
The Free, Starter and Pro plans are described in the app. Plan payments are processed by Paystack. Customer payments to vendors are between the customer and the vendor, and Shopa may charge a service fee shown in the app. [Add your refund policy here.]

## 7. Our responsibility
We try to keep Shopa available and safe, but we cannot promise it will never have errors or downtime. As far as the law allows, we are not responsible for disputes between vendors and customers.

## 8. Changes
We may update these terms. When we do, we will ask you to accept the new version.

## 9. Contact
[Add your email or WhatsApp number here]$b$),
('privacy',1,'Privacy Policy',$b$## 1. What we collect
Vendors: name, email, phone or WhatsApp number, business name, logo, products, bank transfer details you choose to show, and orders. Customers: the name, phone number, address and notes they enter when ordering. We also count visits to our pages (a daily total, without IP addresses).

## 2. How we use it
To run the service, show orders to the right vendor, send order emails, process plan payments, prevent fraud, and meet legal duties.

## 3. Who sees it
A customer's order details go to the vendor they ordered from. We use service providers to run Shopa, such as Supabase (database and login), Paystack (payments) and an email or SMS provider. We may share information with law enforcement authorities where the law allows or requires it.

## 4. Verification
If we verify a vendor, we will tell you what we check and how long we keep it. We do not ask for identity documents inside the app at this time.

## 5. Keeping data safe
Access is limited, and each vendor can see only their own data. No system is perfectly safe, so please use a strong password.

## 6. Your rights
Under the Nigeria Data Protection Act 2023 you can ask to see, correct or delete your data. Vendors can delete their account in the app. Customers can contact the vendor or us.

## 7. Changes and contact
We will ask you to accept updated versions. [Add your contact email or WhatsApp number here]$b$),
('guidelines',1,'Community Guidelines',$b$## Be honest
Use real photos, prices and descriptions. Do not take payment for goods you cannot deliver.

## Not allowed on Shopa
Illegal drugs, weapons, stolen or counterfeit goods, adult content, scams and fake shops, impersonating another business, harassment or threats, and anything else that is against Nigerian law.

## Treat customers fairly
Answer messages, deliver on time, and fix mistakes. Do not pressure customers or share their details with anyone else.

## What happens if rules are broken
We may flag, suspend or ban an account, and report serious cases to law enforcement authorities where appropriate.$b$)
on conflict (kind,version) do nothing;

notify pgrst, 'reload schema';
