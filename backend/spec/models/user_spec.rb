require 'rails_helper'

RSpec.describe User, type: :model do
  it "is valid with a valid factory" do
    expect(build(:user)).to be_valid
  end

  it "normalizes email by stripping whitespace and downcasing" do
    user = create(:user, email: "  Person@Example.COM  ")
    expect(user.email).to eq("person@example.com")
  end

  it "rejects a duplicate email regardless of case" do
    create(:user, email: "person@example.com")
    duplicate = build(:user, email: "PERSON@example.com")
    expect(duplicate).not_to be_valid
    expect(duplicate.errors[:email]).to be_present
  end

  it "rejects an invalid email format" do
    user = build(:user, email: "not-an-email")
    expect(user).not_to be_valid
  end

  it "requires a password of at least 8 characters" do
    user = build(:user, password: "short")
    expect(user).not_to be_valid
    expect(user.errors[:password]).to be_present
  end

  it "defaults platform_admin to false" do
    expect(create(:user).platform_admin).to be(false)
  end

  describe "authentication" do
    it "authenticates with the correct password and rejects the wrong one" do
      user = create(:user, password: "correct-horse")
      expect(user.authenticate("correct-horse")).to eq(user)
      expect(user.authenticate("wrong-password")).to be(false)
    end
  end
end
