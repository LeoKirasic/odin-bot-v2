const commands = require('./points')
const generateMentions = require('./mockData')
const axios = require('axios')

describe('add points', ()=>{

  describe('regex',()=> {
    xit.each([
      ['@odin-bot ++'],
      ['thanks @odin-bot ++'],
      ['@odin-bot++']
    ])('correct strings trigger the callback', (string) => {
      expect(commands.awardPoints.regex.test(string)).toBeTruthy()
    })

    xit.each([
      ['++'],
      [''],
      [' '],
      [' /'],
      ['odin-bot++'],
      ['/++'],
      ['```function("@odin-bot ++", () => {}```'],
    ])("'%s' does not trigger the callback", (string) => {
      expect(commands.leaderboard.regex.test(string)).toBeFalsy()
    })

    xit.each([
      ['Check this out! @odin-bot ++'],
      ['Don\'t worry about it @odin-bot ++'],
      ['Hey @odin-bot ++'],
      ['/ @odin-bot++ ^ /me /leaderboard /tests$*']
    ])("'%s' - command can be anywhere in the string", (string) => {
      expect(commands.leaderboard.regex.test(string)).toBeTruthy()
    })
    
    xit.each([
      ['@user/++'],
      ['it\'s about/@odin-bot++'],
      ['@odin-bot++isanillusion'],
      ['@odin-bot++/'],
      ['@odin-bot++*'],
      ['@odin-bot++...']
    ])("'%s' - command should be its own word/group - no leading or trailing characters", (string) => {
      expect(commands.leaderboard.regex.test(string)).toBeFalsy()
    })
  })

  describe('callback', () => {
     const {Guild, Channel, Client, User} = require('discord.js')
     axios.post = jest.fn()
  
     const mockSend = jest.fn()
     mockSend.mockImplementation(message => {
      return message
    })

     jest.mock('discord.js', () => {
       return {
         Client : jest.fn().mockImplementation((users, channel) => {
           return {
             channels : {
               get : () => channel
             },
             users : {
               get : (userId) => users.filter(user => `<@${userId}>` === user.id)[0]
             }
           }
         }),
 
         Guild : jest.fn().mockImplementation((members) => {
           return {
             members : members,
             roles : [{name : "club-40"}],
             member : (user) => {
              return members.filter(member => member === user)[0]
             }
           }
         }),

         Channel : jest.fn().mockImplementation(() => {
           return {
             send: mockSend
           }
         }),

         User : jest.fn().mockImplementation((roles, id, points) => {
           return {
             roles: roles,
             id: `<@${id}>`,
             points: points,
             addRole: ()=> {roles.push('club-40')}
           }
         })
       }
     })

     beforeEach(() => {
      axios.post.mockClear();
      mockSend.mockClear()
    });
     
    it('returns correct output for a single user w/o club-40', async () => {
      const author = User([], 1, 10)
      const mentionedUser = User([], 2, 20)
      const channel = Channel()
      // users must be passed in as an array
      const client = Client([author, mentionedUser], channel)  
      const data = {
        author : author,
        content: `${mentionedUser.id} ++`,
        channel : channel,
        client :  client,
        guild : Guild([author, mentionedUser])
      }

      axios.post.mockResolvedValue({data: 
        {
          ...mentionedUser, 
          points: mentionedUser.points +=1
        }
      })

      await commands.awardPoints.cb(data)
      expect(data.channel.send).toHaveBeenCalled()
      expect(data.channel.send.mock.calls[0][0]).toMatchSnapshot()    
    
    })

    it('returns correct output for a single user entering club-40', async () => {
      const author = User([], 1, 10)
      const mentionedUser = User([], 2, 39)
      const channel = Channel()
      const client = Client([author, mentionedUser], channel)  
      const data = {
        author : author,
        content: `${mentionedUser.id} ++`,
        channel : channel,
        client :  client,
        guild : Guild([author, mentionedUser])
      }

      axios.post.mockResolvedValue({data: 
        {
          ...mentionedUser, 
          points: mentionedUser.points +=1
        }
      })

      await commands.awardPoints.cb(data)
      expect(data.channel.send).toHaveBeenCalled()
      console.log(data.channel.send.mock.calls)
      expect(data.channel.send.mock.calls[0][0]).toMatchSnapshot()   
      expect(data.channel.send.mock.calls[1][0]).toMatchSnapshot()    
    })

    it('returns correct output for up to five mentioned users', async () => {
      const author = User([], 1, 10)
      const channel = Channel()

      const mentionedUser1 = User([], 2, 39)
      const mentionedUser2 = User([], 2, 39)
      const mentionedUser3 = User([], 2, 39)
      const mentionedUser4 = User([], 2, 39)
      const client = Client([author, mentionedUser1, mentionedUser2, mentionedUser3, mentionedUser4], channel)  

      const data = {
        author : author,
        content: `${mentionedUser1.id} ++ ${mentionedUser2.id} ++ ${mentionedUser3.id} ++ ${mentionedUser4.id} ++`,
        channel : channel,
        client :  client,
        guild : Guild([author, mentionedUser1, mentionedUser2, mentionedUser3, mentionedUser4])
      }

      axios.post.mockResolvedValueOnce({data: 
        {
          ...mentionedUser1, 
          points: mentionedUser.points +=1
        }
      })
      .mockResolvedValueOnce({data: 
        {
          ...mentionedUser1, 
          points: mentionedUser1.points +=1
        }
      })
      .mockResolvedValueOnce({data: 
        {
          ...mentionedUser2, 
          points: mentionedUser2.points +=1
        }
      })
      .mockResolvedValueOnce({data: 
        {
          ...mentionedUser3, 
          points: mentionedUser3.points +=1
        }
      })
      .mockResolvedValueOnce({data: 
        {
          ...mentionedUser4, 
          points: mentionedUser4.points +=1
        }
      })

      await commands.awardPoints.cb()
      expect(data.channel.send).toHaveBeenCalledTimes(4)
      expect(data.channel.send.mock.calls[0][0]).toMatchSnapshot()   
      expect(data.channel.send.mock.calls[1][0]).toMatchSnapshot()    
      expect(data.channel.send.mock.calls[2][0]).toMatchSnapshot()   
      expect(data.channel.send.mock.calls[3][0]).toMatchSnapshot()    
    })

    xit('returns correct output for more than five mentioned users', async () => {
      
 
      await commands.awardPoints.cb()
      expect(data.channel.send).toHaveBeenCalled()
      expect().toMatchSnapshot()   
      data.channel.send.mockClear() 
    })

    it('returns correct output for a user mentioning themselves', async () => {
    
      const author = User([], 1, 10)
      const channel = Channel()
      // users must be passed in as an array
      const client = Client([author], channel)  
      const data = {
        author : author,
        content: `${author.id} ++`,
        channel : channel,
        client :  client,
        guild : Guild([author])
      }

      axios.post.mockResolvedValue({data: 
        {
          ...author, 
          points: author.points +=1
        }
      }) 
 
      await commands.awardPoints.cb(data)
      expect(data.channel.send).toHaveBeenCalled()
      expect(data.channel.send.mock.calls[0][0]).toMatchSnapshot()  
      expect(data.channel.send.mock.calls[1][0]).toMatchSnapshot()  
  
    })

    xit('returns correct output for a user mentioning Odin Bot', async () => {
      
 
      await commands.awardPoints.cb()
      expect(data.channel.send).toHaveBeenCalled()
      expect().toMatchSnapshot()   
    })
  })
})

describe('deduct points', ()=>{

  describe('regex',()=> {
    xit.each([
      ['@odin-bot --'],
      ['thanks @odin-bot --'],
      ['@odin-bot--']
    ])('correct strings trigger the callback', (string) => {
    
    })
    xit.each([
      ['--'],
      [''],
      [' '],
      [' /'],
      ['odin-bot--'],
      ['/--'],
      ['```function("@odin-bot --", () => {}```'],
    ])("'%s' does not trigger the callback", (string) => {
      expect(commands.leaderboard.regex.test(string)).toBeFalsy()
    })

    xit.each([
      ['Check this out! @odin-bot --'],
      ['Don\'t worry about it @odin-bot --'],
      ['Hey @odin-bot --'],
      ['/ @odin-bot-- ^ /me /leaderboard /tests$*']
    ])("'%s' - command can be anywhere in the string", (string) => {
      expect(commands.leaderboard.regex.test(string)).toBeTruthy()
    })
    
    xit.each([
      ['@user/--'],
      ['it\'s about/@odin-bot--'],
      ['@odin-bot--isanillusion'],
      ['@odin-bot--/'],
      ['@odin-bot--*'],
      ['@odin-bot--...']
    ])("'%s' - command should be its own word/group - no leading or trailing characters", (string) => {
      expect(commands.leaderboard.regex.test(string)).toBeFalsy()
    })
  })

  describe('callback', () => {
    xit('returns correct output', async () => {
      expect(commands.deductPoints()).toMatchSnapshot()
    })
  })
})

describe('/points', ()=>{
  describe('regex',()=> {
    xit.each([
      ['/points @odin-bot'],
      ['let me check out my /points @odin-bot'],
      ['/points @odin-bot @odin-bot-v2']
    ])('correct strings trigger the callback', (string) => {
      expect(commands.points.regex.test(string)).toBeTruthy()
    })
  })
})

describe('/leaderboard', ()=>{

  describe('regex',()=> {
    xit.each([
      ['/leaderboard'],
      ['@odin-bot /leaderboard'],
      ['/leaderboard n=10 start=30'],
      ['/leaderboard n=20 start=50'],
      ['/leaderboard n=10'],
      ['/leaderboard start=30']
    ])('correct strings trigger the callback', (string) => {
      expect(commands.leaderboard.regex.test(string)).toBeTruthy()
    })

    xit.each([
      ['/leaderboad'],
      [''],
      [' '],
      [' /'],
      ['/lead'],
      ['leaderboard'],
      ['/le'],
      ['/leaderboards'],
      ['```function("/leaderboard", () => {}```'],
      ['/leader'],
      ['@odin-bot / leaderboard'],
      ['@odin-bot /leaderbard'],
      ['/leaderbord n=10 start=30']
    ])("'%s' does not trigger the callback", (string) => {
      expect(commands.leaderboard.regex.test(string)).toBeFalsy()
    })

    xit.each([
      ['Check this out! /leaderboard'],
      ['Don\'t worry about /leaderboard'],
      ['Hey @odin-bot, /leaderboard'],
      ['/@odin-bot ^ /me /leaderboard /tests$*']
    ])("'%s' - command can be anywhere in the string", (string) => {
      expect(commands.leaderboard.regex.test(string)).toBeTruthy()
    })

    xit.each([
      ['@user/leaderboard'],
      ['it\'s about/leaderboard'],
      ['/leaderboardisanillusion'],
      ['/leaderboard/'],
      ['/leaderboard*'],
      ['/leaderboard...']
    ])("'%s' - command should be its own word/group - no leading or trailing characters", (string) => {
      expect(commands.leaderboard.regex.test(string)).toBeFalsy()
    })
  })

  describe('callback', () => {
    xit('returns correct output', async () => {
      expect(await commands.leaderboard.cb("/leaderboard n=10 start=10")).toMatchSnapshot()
    })
  })
})
